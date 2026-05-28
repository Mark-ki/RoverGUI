const express = require("express");
const http = require("http");
const path = require('path');
const { Server } = require("socket.io");
const cors = require("cors");
const pty = require("node-pty");
const os = require("os");
const WebSocket = require('ws');
const dgram = require('dgram');
const { createCanvas, loadImage } = require('canvas');
const csv = require('csv-parser');
const fs = require('fs');
const zmq = require('zeromq');

// --- Constants & Configuration ---
const DISCOVERY_MESSAGE_TYPE = "WRECORDER_DISCOVERY";
const DISCOVERY_VERSION = 1;
const DISCOVERY_PORT = 5550;
const DISCOVERY_TIMEOUT_SECONDS = 5.0;

const logger = {
    info: (msg) => console.log(`\x1b[92m[INFO]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[93m[WARN]\x1b[0m ${msg}`),
    error: (msg) => console.log(`\x1b[91m[ERROR]\x1b[0m ${msg}`),
};

// --- App Setup ---
const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- Terminal Logic (xterm.js) ---
io.on("connection", (socket) => {
    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
    const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
    });

    ptyProcess.on("data", (data) => socket.emit("output", data));
    socket.on("input", (input) => ptyProcess.write(input));
    socket.on("resize", ({ cols, rows }) => ptyProcess.resize(cols, rows));
    socket.on("disconnect", () => ptyProcess.kill());
});

// --- CSV Path Data Endpoint ---
app.get('/path-data', (req, res) => {
    const results = [];
    const filePath = path.join(__dirname, '..', 'path.csv');

    if (!fs.existsSync(filePath)) {
        return res.json({ 
            status: 'waiting', 
            message: 'File does not exist yet. Retrying...', 
            data: [] 
        });
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            res.json({ status: 'ready', data: results });
        })
        .on('error', (error) => {
            res.status(500).json({ error: 'Error parsing CSV', details: error.message });
        });
});

// --- Utilities ---
function isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// --- Discovery Logic ---
function parseDiscoveryPayload(msg, nameFilter = null) {
    try {
        const payload = JSON.parse(msg.toString('utf8'));
        if (payload.type !== DISCOVERY_MESSAGE_TYPE || payload.version !== DISCOVERY_VERSION) return null;

        const streamerName = (payload.streamer_name || "").trim();
        const streamerIp = (payload.streamer_ip || "").trim();
        const basePort = payload.base_port;
        const streamCount = payload.stream_count;
        const mosaic = Boolean(payload.mosaic);

        if (nameFilter && streamerName !== nameFilter) return null;
        if (!streamerIp || !streamerName || !isValidPort(basePort)) return null;
        if (!mosaic && streamCount < 1) return null;

        // Force streamCount to 1 if mosaic is accidentally set but we are doing TCP
        const finalStreamCount = mosaic ? 1 : streamCount;

        return { streamerName, streamerIp, basePort, streamCount: finalStreamCount, mosaic };
    } catch (e) { return null; }
}

async function discoverStreamConfig(port, timeout, nameFilter = null) {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    
    return new Promise((resolve) => {
        logger.info(`Listening for discovery on UDP ${port} (filter=${nameFilter || 'none'})...`);
        
        const timer = setTimeout(() => {
            socket.close();
            resolve(null);
        }, timeout * 1000);

        socket.on('message', (msg) => {
            const config = parseDiscoveryPayload(msg, nameFilter);
            if (config) {
                logger.info(`Discovered '${config.streamerName}' at ${config.streamerIp}`);
                logger.info(`--> Base Port: ${config.basePort}, Stream Count: ${config.streamCount}`);
                clearTimeout(timer);
                socket.close();
                resolve(config);
            }
        });
        socket.bind(port);
    });
}

// --- Raw WebSocket Server ---
// Kept exactly as it is in your current version so the frontend connects normally
const wss = new WebSocket.Server({ server, path: '/frames' });

wss.on('connection', (socket) => {
    logger.info('Raw WebSocket client connected to /frames');
    socket.on('error', (err) => logger.error(`WebSocket client error: ${err.message}`));
    socket.on('close', () => logger.info('WebSocket client disconnected from /frames'));
});

wss.on('error', (err) => {
    logger.error(`WebSocket server error: ${err.message}`);
});

// --- ZMQ Bridge (From Previous Version) ---
class ZMQBridge {
    constructor(zmqSources, wssInstance) {
        this.zmqSources = zmqSources; 
        this.wss = wssInstance; // Using the existing /frames WebSocket server
        this.subscribers = [];
    }

    async start() {
        try {
            for (const { zmqIp, zmqBasePort, streamCount, flip, streamerName } of this.zmqSources) {
                for (let i = 0; i < streamCount; i++) {
                    const port = zmqBasePort + i;
                    const sock = new zmq.Subscriber();
                    await sock.connect(`tcp://${zmqIp}:${port}`);
                    sock.subscribe('');

                    const streamId = `${streamerName}_${i}`;
                    logger.info(`Connected to ZMQ stream ${streamId} at tcp://${zmqIp}:${port}`);

                    this.subscribers.push({ sock, port });

                    // Forward frames using the single port routing key
                    this.forwardFrames(sock, port, flip[i]);
                }
            }
        } catch (err) {
            logger.error(`Error starting ZMQBridge: ${err.message}`);
            this.close();
        }
    }

    async forwardFrames(sock, port, flip) {
        for await (const [msg] of sock) {
            let base64Frame = Buffer.from(msg).toString('base64');

            // Kept intact from previous version, but defaults to false in config
            if (flip) {
                base64Frame = await this.flipImage(base64Frame);
            }

            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        port: port, // Matches frontend expectations
                        frame: base64Frame,
                        timestamp: Date.now()
                    }));
                }
            });
        }
    }

    async flipImage(base64Str) {
        try {
            const img = await loadImage(Buffer.from(base64Str, 'base64'));
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');

            ctx.translate(img.width, img.height);
            ctx.scale(-1, -1);
            ctx.drawImage(img, 0, 0);

            return canvas.toDataURL().split(',')[1];
        } catch (err) {
            logger.error(`Error flipping image: ${err.message}`);
            return base64Str;
        }
    }

    close() {
        this.subscribers.forEach(({ sock }) => sock.close());
    }
}

// --- Main Execution ---
(async () => {
    const streamers = ["cam-pi-1", "cam-pi-2"];
    const zmqSources = [];

    for (const name of streamers) {
        const config = await discoverStreamConfig(DISCOVERY_PORT, DISCOVERY_TIMEOUT_SECONDS, name);
        if (config) {
            zmqSources.push({ 
                zmqIp: config.streamerIp, 
                zmqBasePort: config.basePort, 
                streamCount: config.streamCount, 
                streamerName: config.streamerName,
                // Creates an array of `false` values matching the stream count to skip the laggy flip function
                flip: Array(config.streamCount).fill(false) 
            });
        }
    }

    // Pass our sources and our existing wss instance to the Bridge
    const bridge = new ZMQBridge(zmqSources, wss);
    bridge.start().catch((err) => logger.error(err.message));

    // Graceful Shutdown
    process.on('SIGINT', () => {
        logger.info("Shutting down...");
        bridge.close();
        process.exit();
    });
})();

const PORT = 3001;
server.listen(PORT, () => logger.info(`🚀 Web Server running on http://localhost:${PORT}`));