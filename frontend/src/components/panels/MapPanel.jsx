import React from "react";

const MapPanel = () => {
  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 w-full h-full">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-2 flex justify-between items-center">
        <span className="text-xs">NAVIGATION MAP</span>
        <div className="flex space-x-2 text-xs">
          <span className="text-green-400">GPS LOCK</span>
          <span className="text-slate-500">|</span>
          <span>ZOOM: 1:500</span>
        </div>
      </div>

      {/* Map body */}
      <div className="relative flex-1 bg-slate-800 p-4 overflow-hidden">
        {/* Simulated map grid */}
        <svg className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[...Array(20)].map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="300" stroke="#374151" strokeWidth="0.5" />
          ))}
          {[...Array(15)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#374151" strokeWidth="0.5" />
          ))}

          {/* Path trace */}
          <polyline
            points="50,250 100,200 150,180 200,160 250,140 300,120"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3,2"
          />

          {/* Rover position */}
          <circle cx="300" cy="120" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          <text x="310" y="125" fill="#10b981" fontSize="8">
            ROVER
          </text>

          {/* Waypoints */}
          <circle cx="350" cy="100" r="2" fill="#fbbf24" />
          <text x="355" y="105" fill="#fbbf24" fontSize="6">
            WP1
          </text>

          {/* Obstacles */}
          <rect x="180" y="200" width="20" height="15" fill="#ef4444" opacity="0.5" />
          <rect x="220" y="180" width="15" height="20" fill="#ef4444" opacity="0.5" />
        </svg>

        {/* Map controls */}
        <div className="absolute top-4 right-4 space-y-1">
          <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">+</button>
          <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">-</button>
        </div>

        {/* Coordinates display */}
        <div className="absolute bottom-4 left-4 text-xs space-y-1">
          <div>LAT: 40.7128° N</div>
          <div>LON: 74.0060° W</div>
          <div>ALT: 10.2m</div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
