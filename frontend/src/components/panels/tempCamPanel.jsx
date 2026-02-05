import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

const CameraStream = forwardRef(({ port }, ref) => {
    const canvasRef = useRef(null);
    const [stats, setStats] = useState({ fps: 0, dataRate: 0 });
    const statsRef = useRef({ frameCount: 0, lastTime: Date.now(), bytesReceived: 0 });

    // Expose drawFrame function to parent via ref
    useImperativeHandle(ref, () => ({
        drawFrame: (base64Frame) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Draw stats overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(5, 5, 200, 60);
                ctx.fillStyle = '#00FF00';
                ctx.font = '16px monospace';
                ctx.fillText(`Port: ${port}`, 10, 25);
                ctx.fillText(`FPS: ${stats.fps}`, 10, 45);
                ctx.fillText(`Rate: ${stats.dataRate} KB/s`, 10, 65);

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
            const dataRate = statsRef.current.bytesReceived / elapsed / 1024; // KB/s

            setStats({ fps: fps.toFixed(1), dataRate: dataRate.toFixed(1) });

            statsRef.current.frameCount = 0;
            statsRef.current.bytesReceived = 0;
            statsRef.current.lastTime = now;
        }
    };

    return (
        <div style={{ margin: '10px', display: 'inline-block' }}>
            <canvas
                ref={canvasRef}
                style={{
                    border: '2px solid #333',
                    maxWidth: '100%',
                    height: 'auto'
                }}
            />
        </div>
    );
});

export default CameraStream;