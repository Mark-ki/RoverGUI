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
