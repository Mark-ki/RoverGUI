import React, { useEffect, useState, useRef } from 'react';
import { useXTerm } from 'react-xtermjs';
import { io } from 'socket.io-client';
import 'xterm/css/xterm.css';

const ConsolePanel = () => {
    const { instance, ref } = useXTerm();
    const [inputBuffer, setInputBuffer] = useState("");
    const bufferRef = useRef("");

    useEffect(() => {
    if (!instance) return;

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      instance.writeln("\x1b[1;32mConnected to backend shell.\x1b[0m");
      instance.write(" ");
    });

    socket.on("output", (data) => instance.write(data));

    instance.onData((data) => {
      if (data === "\r") {
        // ENTER pressed — send command
        socket.emit("input", bufferRef.current + "\n");
        bufferRef.current = "";
        instance.write("\r\n ");
      } else if (data.charCodeAt(0) === 127) {
        // BACKSPACE
        if (bufferRef.current.length > 0) {
          bufferRef.current = bufferRef.current.slice(0, -1);
          instance.write("\b \b");
        }
      } else {
        // Append typed char and echo it locally
        bufferRef.current += data;
        instance.write(data);
      }
    });

    socket.on("disconnect", () => {
        instance.writeln("\r\n\x1b[31mConnection closed.\x1b[0m");
    });

    return () => socket.disconnect();
    }, [instance]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
};

export default ConsolePanel;