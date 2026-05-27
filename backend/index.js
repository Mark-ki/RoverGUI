const express = require("express");
const http = require("http");
const path = require('path');
const { Server } = require("socket.io");
const cors = require("cors");
const pty = require("node-pty");
const os = require("os");

const logger = {
    info: (msg) => console.log(`\x1b[92m[INFO]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[93m[WARN]\x1b[0m ${msg}`),
    error: (msg) => console.log(`\x1b[91m[ERROR]\x1b[0m ${msg}`),
};

// --- App Setup ---
const app = express();
app.use(cors());

// Serve your React frontend build
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

// --- Terminal Logic (xterm.js) ---
// We keep Socket.io here ONLY for the interactive remote terminal
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
    logger.info("Terminal client connected");
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
    
    socket.on("disconnect", () => {
        logger.info("Terminal client disconnected");
        ptyProcess.kill();
    });
});

// --- Main Execution ---
const PORT = 3001;

// Graceful Shutdown
process.on('SIGINT', () => {
    logger.info("Shutting down Node Backend...");
    process.exit();
});

server.listen(PORT, () => {
    logger.info(`🚀 Node Web Server running on http://localhost:${PORT}`);
    logger.info(`👉 Note: WebRTC Video is now handled separately via Rust Signaling Server on port 8443`);
});