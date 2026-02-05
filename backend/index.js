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

class ZMQBridge {
    constructor(zmqIp, zmqBasePort, streamCount, wsPort) {
        this.zmqIp = zmqIp;
        this.zmqBasePort = zmqBasePort;
        this.streamCount = streamCount;
        this.wsPort = wsPort;
        this.wss = null;
        this.subscribers = [];
    }

    async start() {
        // Create WebSocket server
        this.wss = new WebSocket.Server({ port: this.wsPort });
        console.log(`WebSocket server listening on port ${this.wsPort}`);

        // Set up ZMQ subscribers for each stream
        for (let i = 0; i < this.streamCount; i++) {
            const port = this.zmqBasePort + i;
            const sock = new zmq.Subscriber();
            await sock.connect(`tcp://${this.zmqIp}:${port}`);
            sock.subscribe('');

            console.log(`Connected to ZMQ stream at tcp://${this.zmqIp}:${port}`);

            this.subscribers.push({ sock, port });

            // Forward frames from this ZMQ socket to all WebSocket clients
            this.forwardFrames(sock, port);
        }

        // Handle WebSocket connections
        this.wss.on('connection', (ws) => {
            console.log('Client connected');

            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }

    async forwardFrames(sock, port) {
        for await (const [msg] of sock) {
            const base64Frame = msg.toString();

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

    close() {
        this.subscribers.forEach(({ sock }) => sock.close());
        if (this.wss) {
            this.wss.close();
        }
    }
}

// Usage
const bridge = new ZMQBridge('127.0.0.1', 5555, 3, 8081);
bridge.start().catch(console.error);

process.on('SIGINT', () => {
    console.log('Shutting down...');
    bridge.close();
    process.exit();
});