const express = require("express");
const http = require("http");
const path = require('path');
const { Server } = require("socket.io");
const cors = require("cors");
// const pty = require("node-pty-prebuilt-multiarch");
const pty = require("node-pty");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.get("/", (req, res) => res.send("Xterm backend running ✅"));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

    // Spawn a pseudo-terminal
    const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env,
    });

    // Data from shell → browser
    ptyProcess.on("data", (data) => socket.emit("output", data));

    // Data from browser → shell
    socket.on("input", (input) => ptyProcess.write(input));

    // Handle terminal resize
    socket.on("resize", ({ cols, rows }) => {
        ptyProcess.resize(cols, rows);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        ptyProcess.kill();
    });
});

const PORT = 3001;
server.listen(PORT, () =>
    console.log(`🚀 Server running on http://localhost:${PORT}`)
);


// ZMQ to WebSocket Bridge

const zmq = require('zeromq');
const WebSocket = require('ws');
const { createCanvas, loadImage } = require('canvas');

class ZMQBridge {
    constructor(zmqSources, wsPort) {
        this.zmqSources = zmqSources; // Array of { zmqIp, zmqBasePort, streamCount }
        this.wsPort = wsPort;
        this.wss = null;
        this.subscribers = [];
    }

    async start() {
        try {
            // Create WebSocket server
            this.wss = new WebSocket.Server({ port: this.wsPort });
            console.log(`WebSocket server listening on port ${this.wsPort}`);

            // Set up ZMQ subscribers for each stream
            for (const { zmqIp, zmqBasePort, streamCount, flip } of this.zmqSources) {
                for (let i = 0; i < streamCount; i++) {
                    const port = zmqBasePort + i;
                    const sock = new zmq.Subscriber();
                    await sock.connect(`tcp://${zmqIp}:${port}`);
                    sock.subscribe('');

                    console.log(`Connected to ZMQ stream at tcp://${zmqIp}:${port}`);

                    this.subscribers.push({ sock, port });

                    // Forward frames from this ZMQ socket to all WebSocket clients
                    this.forwardFrames(sock, port, flip[i]);
                }

                // Handle WebSocket connections
                this.wss.on('connection', (ws) => {
                    console.log('Client connected');

                    ws.on('close', () => {
                        console.log('Client disconnected');
                    });
                });
            }
        } catch (err) {
            console.error('Error starting ZMQBridge:', err);
            this.close();
        }
    }

    async forwardFrames(sock, port, flip) {
        for await (const [msg] of sock) {
            let base64Frame = msg.toString();

            if (flip) {
                base64Frame = await this.flipImage(base64Frame);
            }

            // Broadcast to all connected clients
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        port: port,
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

            // Flip vertically & horizontally
            ctx.translate(img.width, img.height);
            ctx.scale(-1, -1);
            ctx.drawImage(img, 0, 0);

            return canvas.toDataURL().split(',')[1]; // Return base64 without prefix
        } catch (err) {
            console.error('Error flipping image:', err);
            return base64Str; // Return original if flipping fails
        }
    }

    close() {
        this.subscribers.forEach(({ sock }) => sock.close());
        if (this.wss) {
            this.wss.close();
        }
    }
}

// Usage
const zmqSources = [
    //{ zmqIp: '192.168.1.169', zmqBasePort: 4444, streamCount: 1 , flip: [ false] },
    // { zmqIp: '192.168.1.192', zmqBasePort: 5555, streamCount: 8, flip: [false]*8},
    { zmqIp: '10.116.152.155', zmqBasePort: 5555, streamCount: 8, flip: [false]*8},
]
const bridge = new ZMQBridge(zmqSources, 8081);
bridge.start().catch(console.error);


process.on('SIGINT', () => {
    console.log('Shutting down...');
    bridge.close();
    process.exit();
});
