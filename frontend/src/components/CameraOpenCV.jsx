import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';

const CameraStream = forwardRef(({ port }, ref) => {
    const canvasRef = useRef(null);
    const [stats, setStats] = useState({ fps: 0, dataRate: 0 });
    const statsRef = useRef({ frameCount: 0, lastTime: Date.now(), bytesReceived: 0 });

    useImperativeHandle(ref, () => ({
        drawFrame: (base64Frame) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 1. Sync internal resolution to the image source only
                if (canvas.width !== img.width || canvas.height !== img.height) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }

                // 2. Draw the frame
                ctx.drawImage(img, 0, 0);

                // 3. Draw stats overlay (scaled to the internal resolution)
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'; // Slate-900 with alpha
                ctx.fillRect(10, 10, 180, 50);
                ctx.fillStyle = '#4ade80'; // Tailwind green-400
                ctx.font = 'bold 14px monospace';
                ctx.fillText(`PORT: ${port}`, 20, 30);
                ctx.fillText(`FPS: ${stats.fps} | ${stats.dataRate} KB/s`, 20, 50);

                statsRef.current.frameCount++;
                statsRef.current.bytesReceived += base64Frame.length;
                updateStats();
            };

            img.src = `data:image/jpeg;base64,${base64Frame}`;
        }
    }));

    const updateStats = () => {
        const now = Date.now();
        const elapsed = (now - statsRef.current.lastTime) / 1000;

        if (elapsed >= 1.0) {
            const fps = statsRef.current.frameCount / elapsed;
            const dataRate = statsRef.current.bytesReceived / elapsed / 1024;
            setStats({ fps: fps.toFixed(1), dataRate: dataRate.toFixed(1) });
            statsRef.current.frameCount = 0;
            statsRef.current.bytesReceived = 0;
            statsRef.current.lastTime = now;
        }
    };

    return (
        /* Fill the parent's aspect-video container exactly like a <video> tag would */
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover bg-black"
        />
    );
});

export default CameraStream;