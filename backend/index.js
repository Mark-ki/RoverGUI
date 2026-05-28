const express = require("express");
const http = require("http");
const path = require('path');
const { spawn } = require('child_process');
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

// --- Utilities (Reimplemented from common_utils.py) ---
function isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function buildSequentialPorts(basePort, count) {
    if (!isValidPort(basePort) || !isValidPort(basePort + count - 1)) return null;
    return Array.from({ length: count }, (_, i) => basePort + i);
}

function buildMosaicGrid(cameraCount) {
    const columns = Math.ceil(Math.sqrt(cameraCount));
    const rows = Math.ceil(cameraCount / columns);

    return { columns, rows };
}

async function splitMosaicFrame(frameBuffer, targets, grid) {
    const image = await loadImage(frameBuffer);
    const tileWidth = Math.floor(image.width / grid.columns);
    const tileHeight = Math.floor(image.height / grid.rows);

    return targets.map((target) => {
        const column = target.index % grid.columns;
        const row = Math.floor(target.index / grid.columns);
        const sourceX = column * tileWidth;
        const sourceY = row * tileHeight;
        const sourceWidth = column === grid.columns - 1 ? image.width - sourceX : tileWidth;
        const sourceHeight = row === grid.rows - 1 ? image.height - sourceY : tileHeight;

        const canvas = createCanvas(sourceWidth, sourceHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight
        );

        return {
            port: target.port,
            cameraId: target.cameraId,
            frame: canvas.toBuffer('image/jpeg', { quality: 0.8 }),
        };
    });
}

function parseDiscoveryPayload(msg, nameFilter = null) {
    try {
        const payload = JSON.parse(msg.toString('utf8'));
        if (payload.type !== DISCOVERY_MESSAGE_TYPE || payload.version !== DISCOVERY_VERSION) return null;

        const streamerName = (payload.streamer_name || "").trim();
        const streamerIp = (payload.streamer_ip || "").trim();
        const basePort = payload.base_port;
        const streamCount = payload.stream_count;
        const mosaic = Boolean(payload.mosaic);
        const cameraIds = Array.isArray(payload.camera_ids)
            ? payload.camera_ids
                .map((cameraId) => Number(cameraId))
                .filter((cameraId) => Number.isInteger(cameraId))
            : [];

        if (nameFilter && streamerName !== nameFilter) return null;
        if (!streamerIp || !streamerName || !isValidPort(basePort)) return null;
        if (mosaic && cameraIds.length < 1) return null;
        if (!mosaic && streamCount < 1) return null;

        return { streamerName, streamerIp, basePort, streamCount, mosaic, cameraIds };
    } catch (e) { return null; }
}

function startGStreamerPipeline(port, streamName, options = {}) {
    const { splitTargets = null, mosaicGrid = null } = options;

    // Matches the pipeline logic in SingleReceiver.start from receiver_utils.py
    // but ends in jpegenc + fdsink for web streaming
    if (activePorts.has(port)) {
        logger.warn(`Pipeline for port ${port} already running`);
        return;
    }
    activePorts.add(port);
    logger.info(`Starting GStreamer pipeline for ${streamName} on port ${port}`);

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

    gst.on('error', (err) => {
        logger.error(`[GST ${port}] Failed to spawn: ${err.message}`);
        activePorts.delete(port);
    });

    let buffer = Buffer.alloc(0);
    const JPEG_START = Buffer.from([0xff, 0xd8]);
    const JPEG_END = Buffer.from([0xff, 0xd9]);
    // let frameCount = 0;

    gst.stdout.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        if (buffer.length > 5000000) buffer = Buffer.alloc(0); 

        let startIdx = buffer.indexOf(JPEG_START);
        let endIdx = buffer.indexOf(JPEG_END);

        while (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const frame = buffer.slice(startIdx, endIdx + 2);
            // frameCount++;
            
            // if (frameCount % 30 === 0) {
            //     logger.info(`[GST ${port}] Received frame ${frameCount}, clients: ${wss.clients.size}`);
            // }

            if (splitTargets && splitTargets.length > 0) {
                splitMosaicFrame(frame, splitTargets, mosaicGrid)
                    .then((splitFrames) => {
                        for (const splitFrame of splitFrames) {
                            const message = JSON.stringify({
                                port: splitFrame.port,
                                cameraId: splitFrame.cameraId,
                                frame: splitFrame.frame.toString('base64')
                            });

                            wss.clients.forEach((client) => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(message, (err) => {
                                        if (err) logger.error(`Send error: ${err.message}`);
                                    });
                                }
                            });
                        }
                    })
                    .catch((err) => logger.error(`[GST ${port}] Mosaic split failed: ${err.message}`));
            } else {
                const message = JSON.stringify({
                    port: streamName, // Matches your frontend key 'port'
                    frame: frame.toString('base64')
                });

                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(message, (err) => {
                            if (err) logger.error(`Send error: ${err.message}`);
                        });
                    }
                });
            }
            
            buffer = buffer.slice(endIdx + 2);
            startIdx = buffer.indexOf(JPEG_START);
            endIdx = buffer.indexOf(JPEG_END);
        }
    });

    gst.stderr.on('data', (data) => {
        logger.warn(`[GST ${port}] stderr: ${data.toString().trim()}`);
    });

    gst.on('close', (code) => {
        logger.info(`[GST ${port}] Pipeline closed with code ${code}.`); //  Sent ${frameCount} frames.`);
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
                logger.info(`--> Base Port: ${config.basePort}, Stream Count: ${config.streamCount}`);
                clearTimeout(timer);
                socket.close();
                resolve(config);
            }
        });
        socket.bind(port);
    });
}

// --- Bridge (Equivalent to MultiReceiver/FrameStore) ---
// --- Raw WebSocket server for forwarding frames ---
const wss = new WebSocket.Server({ server, path: '/frames' });

wss.on('connection', (socket) => {
    logger.info('Raw WebSocket client connected to /frames');
    
    socket.on('error', (err) => {
        logger.error(`WebSocket client error: ${err.message}`);
    });
    
    socket.on('close', () => {
        logger.info('WebSocket client disconnected from /frames');
    });
});

wss.on('error', (err) => {
    logger.error(`WebSocket server error: ${err.message}`);
});

logger.info('Raw WebSocket server attached to HTTP server at /frames');

// Track active ports to avoid spawning multiple pipelines for same port
const activePorts = new Set();

// --- Main Execution ---
(async () => {
    

    const streamers = ["cam-pi-1", "cam-pi-2"];

    for (const name of streamers) {
        const config = await discoverStreamConfig(DISCOVERY_PORT, DISCOVERY_TIMEOUT_SECONDS, name);
        if (!config) {
            continue;
        }

        if (config.mosaic) {
            const splitTargets = config.cameraIds.map((cameraId, index) => ({
                port: config.basePort + index,
                cameraId,
                index,
            }));
            const mosaicGrid = buildMosaicGrid(splitTargets.length);

            logger.info(
                `Mosaic stream detected for '${config.streamerName}'. Splitting ${splitTargets.length} camera feeds from port ${config.basePort}.`
            );

            startGStreamerPipeline(config.basePort, `${config.streamerName}_mosaic`, {
                splitTargets,
                mosaicGrid,
            });
        } else {
            // Loop through the stream count found in discovery
            for (let i = 0; i < config.streamCount; i++) {
                const port = config.basePort + i;
                const streamId = `${config.streamerName}_${i}`;
                startGStreamerPipeline(port, streamId);
            }
        }
    }

    // Graceful Shutdown
    process.on('SIGINT', () => {
        logger.info("Shutting down...");
        process.exit();
    });
})();

const PORT = 3001;
server.listen(PORT, () => logger.info(`🚀 Web Server running on http://localhost:${PORT}`));