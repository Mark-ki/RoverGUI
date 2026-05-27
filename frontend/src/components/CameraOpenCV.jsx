import React, { useRef, useEffect } from 'react';

const CameraStream = ({ stream, label }) => {
    const videoRef = useRef(null);

    // Bind the WebRTC MediaStream to the video element whenever it updates
    useEffect(() => {
        if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="absolute inset-0 w-full h-full bg-black relative">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
            {/* Overlay replacing the old Canvas ctx.fillText stats */}
            <div className="absolute top-2 left-2 bg-slate-900/80 border border-slate-700 text-green-400 font-mono text-[10px] px-2 py-1 rounded">
                <div className="font-bold text-slate-200">ID: {label}</div>
                <div className="text-green-400 animate-pulse">● WEBRTC LIVE</div>
            </div>
        </div>
    );
};

export default CameraStream;