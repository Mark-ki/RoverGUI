import React, { useEffect, useRef } from "react";
import { useXTerm } from "react-xtermjs";
import { io } from "socket.io-client";
import "xterm/css/xterm.css";

const ConsolePanel = (props) => {
  const { instance, ref } = useXTerm();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!instance) return;

    if (props.onInit) {
      props.onInit({
        execute: (cmd) => {
          // We add \r to simulate hitting the "Enter" key
          socket.emit("input", cmd + "\r"); 
          }
      });
    }

    instance.resize(55, 22);

    // Connect to your Node backend
    const socket = io("http://localhost:3001"); // ✅ Node backend port
    socketRef.current = socket;

    socket.on("connect", () => {
      instance.writeln("\x1b[1;32mConnected to Node shell.\x1b[0m\r\n");
    });

    // Backend → Terminal
    socket.on("output", (data) => instance.write(data));

    // Terminal → Backend
    instance.onData((data) => {
      // Send raw input directly to PTY (no manual buffering needed)
      socket.emit("input", data);
    });

    socket.on("disconnect", () => {
      instance.writeln("\r\n\x1b[31mConnection closed.\x1b[0m\r\n");
    });

    // Handle terminal resize
    const handleResize = () => {
      socket.emit("resize", {
        cols: instance.cols,
        rows: instance.rows,
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.disconnect();
    };
  }, [instance]);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        padding: "10px",
        backgroundColor: "rgb(16, 20, 32)",
      }}
    />
  );
};

export default ConsolePanel;
