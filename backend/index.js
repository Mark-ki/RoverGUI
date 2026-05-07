const express = require("express");
const http = require("http");
const path = require('path');
const { spawn } = require('child_process');
const { Server } = require("socket.io");
const cors = require("cors");
const pty = require("node-pty");
const os = require("os");
const zmq = require('zeromq');
const WebSocket = require('ws');
const dgram = require('dgram');

// --- Constants & Configuration (from common_utils.py) ---
const MULTICAST_IP = "224.1.1.1";
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

// --- Utilities (Reimplemented from common_utils.py) ---
function isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function buildSequentialPorts(basePort, count) {
    if (!isValidPort(basePort) || !isValidPort(basePort + count - 1)) return null;
    return Array.from({ length: count }, (_, i) => basePort + i);
}

function parseDiscoveryPayload(msg, nameFilter = null) {
    try {
        const payload = JSON.parse(msg.toString('utf8'));
        if (payload.type !== DISCOVERY_MESSAGE_TYPE || payload.version !== DISCOVERY_VERSION) return null;

        const streamerName = (payload.streamer_name || "").trim();
        const streamerIp = (payload.streamer_ip || "").trim();
        const basePort = payload.base_port;
        const streamCount = payload.stream_count;

        if (nameFilter && streamerName !== nameFilter) return null;
        if (!streamerIp || !streamerName || !isValidPort(basePort) || streamCount < 1) return null;

        return { streamerName, streamerIp, basePort, streamCount };
    } catch (e) { return null; }
}

function startGStreamerPipeline(port, streamName) {
    // Matches the pipeline logic in SingleReceiver.start from receiver_utils.py
    // but ends in jpegenc + fdsink for web streaming
    const gst = spawn('gst-launch-1.0', [
        'udpsrc', `multicast-group=${MULTICAST_IP}`, `port=${port}`, 'auto-multicast=true', '!',
        'application/x-rtp,media=video,clock-rate=90000,payload=96,encoding-name=H264', '!',
        'rtpjitterbuffer', 'latency=0', '!',
        'rtph264depay', '!', 
        'h264parse', '!', 
        'avdec_h264', '!',
        'videoconvert', '!', 
        'jpegenc', 'quality=60', '!',
        'fdsink'
    ]);

    let buffer = Buffer.alloc(0);
    const JPEG_START = Buffer.from([0xff, 0xd8]);
    const JPEG_END = Buffer.from([0xff, 0xd9]);

    gst.stdout.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.length > 5000000) buffer = Buffer.alloc(0); 

        let startIdx = buffer.indexOf(JPEG_START);
        let endIdx = buffer.indexOf(JPEG_END);

        while (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const frame = buffer.slice(startIdx, endIdx + 2);
            
            // --- UPDATED FOR RAW WEBSOCKETS ---
            const message = JSON.stringify({
                port: streamName, // Matches your frontend key 'port'
                frame: frame.toString('base64')
            });

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
            
            buffer = buffer.slice(endIdx + 2);
            startIdx = buffer.indexOf(JPEG_START);
            endIdx = buffer.indexOf(JPEG_END);
        }
    });

    gst.stderr.on('data', (data) => {
        console.error(`[GST ${port} Debug]: ${data}`);
    });

    gst.on('close', () => {
        console.log(`[GST ${port}] Pipeline closed.`);
        activePorts.delete(port);
    });
}

// --- Discovery Logic (Equivalent to discover_stream_config) ---
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
                clearTimeout(timer);
                socket.close();
                resolve(config);
            }
        });
        socket.bind(port);
    });
}

// --- ZMQ Bridge (Equivalent to MultiReceiver/FrameStore) ---
class ZMQBridge {
    constructor(wsPort) {
        this.wsPort = wsPort;
        this.wss = null;
        this.subscribers = [];
    }

    async addStreamer(config) {
        const ports = buildSequentialPorts(config.basePort, config.streamCount);
        if (!ports) {
            logger.error(`Invalid port range for ${config.streamerName}`);
            return;
        }

        for (let i = 0; i < ports.length; i++) {
            const port = ports[i];
            const sock = new zmq.Subscriber();
            await sock.connect(`tcp://${config.streamerIp}:${port}`);
            sock.subscribe('');
            
            const streamId = `${config.streamerName}_${i}`;
            this.subscribers.push(sock);
            this.forwardFrames(sock, streamId);
            logger.info(`Subscribed to ${streamId} on port ${port}`);
        }
    }

    async forwardFrames(sock, streamId) {
        try {
            for await (const [msg] of sock) {
                const payload = JSON.stringify({
                    streamId,
                    frame: msg.toString(),
                    timestamp: Date.now()
                });

                this.wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(payload);
                    }
                });
            }
        } catch (err) {
            logger.error(`Stream ${streamId} error: ${err.message}`);
        }
    }

    start() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        logger.info(`WebSocket Bridge running on port ${this.wsPort}`);
    }

    close() {
        this.subscribers.forEach(s => s.close());
        if (this.wss) this.wss.close();
    }
}

// --- Main Execution ---
(async () => {
    // const bridge = new ZMQBridge(8081);
    // bridge.start();

    // Parallel discovery for all configured streamers
    const streamers = ["cam-pi-1", "cam-pi-2"];
    // const discoveries = streamers.map(name => 
    //     discoverStreamConfig(DISCOVERY_PORT, DISCOVERY_TIMEOUT_SECONDS, name)
    // );

    // const configs = await Promise.all(discoveries);

    // for (const config of configs) {
    //     if (config) {
    //         await bridge.addStreamer(config);
    //     } else {
    //         logger.warn("A discovery task timed out.");
    //     }
    // }

    for (const name of streamers) {
        const config = await discoverStreamConfig(DISCOVERY_PORT, DISCOVERY_TIMEOUT_SECONDS, name);
        if (config) {
            // Loop through the stream count found in discovery
            for (let i = 0; i < config.stream_count; i++) {
                const port = config.base_port + i;
                const streamId = `${config.streamer_name}_${i}`;
                startGStreamerPipeline(port, streamId);
            }
        }
    }

    // Graceful Shutdown
    process.on('SIGINT', () => {
        logger.info("Shutting down...");
        // bridge.close();
        process.exit();
    });
})();

const PORT = 3001;
server.listen(PORT, () => logger.info(`🚀 Web Server running on http://localhost:${PORT}`));