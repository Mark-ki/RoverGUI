import React, { useEffect, useState, useRef } from 'react';
import CameraStream from './tempCamPanel';

function TempCamWrapper() {
    const [streams, setStreams] = useState({});
    const wsRef = useRef(null);
    const streamRefsRef = useRef({});

    useEffect(() => {
        // Connect to WebSocket bridge
        const ws = new WebSocket('ws://localhost:8081');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const { port, frame } = data;

                // Update streams state to track active ports
                setStreams(prev => {
                    if (!prev[port]) {
                        return { ...prev, [port]: true };
                    }
                    return prev;
                });

                // Call the draw function for this port if ref exists
                const streamRef = streamRefsRef.current[port];
                if (streamRef && streamRef.drawFrame) {
                    streamRef.drawFrame(frame);
                }
            } catch (err) {
                console.error('Error processing frame:', err);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, []);

    return (
        <div className="App">
            <h1>Camera Streams</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {Object.keys(streams).map(port => (
                    <CameraStream
                        key={port}
                        port={parseInt(port)}
                        ref={(el) => {
                            if (el) {
                                streamRefsRef.current[port] = el;
                            } else {
                                delete streamRefsRef.current[port];
                            }
                        }}
                    />
                ))}
                {Object.keys(streams).length === 0 && (
                    <p>Waiting for streams...</p>
                )}
            </div>
        </div>
    );
}

export default TempCamWrapper;