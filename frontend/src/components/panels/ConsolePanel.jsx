import React, { useEffect, useRef } from "react";
import { useXTerm } from "react-xtermjs";
import { io } from "socket.io-client";
import { FitAddon } from "@xterm/addon-fit"; // 1. Import FitAddon
import "xterm/css/xterm.css";

const ConsolePanel = (props) => {
  const { instance, ref } = useXTerm();
  const socketRef = useRef(null);
  const fitAddonRef = useRef(new FitAddon());

  useEffect(() => {
    if (!instance) return;
    instance.loadAddon(fitAddonRef.current);

    if (props.onInit) {
      props.onInit({
        execute: (cmd) => {
          // We add \r to simulate hitting the "Enter" key
          socket.emit("input", cmd + "\r"); 
          }
      });
    }

    // Connect to your Node backend
    const socket = io(props.ip); // ✅ Node backend port
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
      fitAddonRef.current.fit(); // Recalculate cols/rows based on UI
      
      // Tell the backend PTY the new dimensions
      socket.emit("resize", {
        cols: instance.cols,
        rows: instance.rows,
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      resizeObserver.disconnect();
      socket.disconnect();
    };

  }, [instance]);

  return (
    <div
      ref={ref}
      className="custom-terminal-scrollbar"
      style={{
        width: "100%",
        height: "100%",
        padding: "10px",
        paddingTop: "0px",
        backgroundColor: "rgb(16, 20, 32)",
      }}
    />
  );
};

export default ConsolePanel;
