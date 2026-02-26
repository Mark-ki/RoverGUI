import React, {useState, useEffect, useMemo} from "react";
import mapImg from '../../assets/map_randall.png';

const MapPanel = ({roverPos, dronePos, coordinates, visitedWaypoints, roverHeading}) => {
  const [autoZoom, setAutoZoom] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const zoomScale = useMemo(() => {
    if (!autoZoom || coordinates.length === 0) return 1;

    const nextWaypoint = coordinates[0]; // Add logic so that traversed waypoints are taken out of the coord list
    const distance = Math.sqrt(
      Math.pow(nextWaypoint.x - roverPos.x, 2) +
      Math.pow(nextWaypoint.y - roverPos.y, 2)
    );

    const scale = Math.max(0.5, Math.min(4.0, 1 + (100 / Math.max(distance, 5))))
    return scale;
  }, [roverPos, coordinates, autoZoom]);

  // Calculate transforms
  const svgTransform = useMemo(() => {
    const centerX = 200;
    const centerY = 150;

    let transform = '';

    // Leave for now
    // if (autoRotate) {
    //   transform += `rotate(${-roverHeading})`;
    // }

    if (autoZoom) {
      transform += `translate(${centerX}, ${centerY})`;
      transform += ` scale(${zoomScale})`;
      // Translate to center on rover
      transform += ` translate(${-roverPos.x}, ${-roverPos.y})`;
    }

    return transform;
  }, [roverPos, zoomScale, autoZoom])


  const pathPoints = [
            `${roverPos.x}, ${roverPos.y}`,
            ...coordinates.map(coord => `${coord.x}, ${coord.y}`)
          ].join(' ');

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 w-full h-full">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-2 flex justify-between items-center">
        <span className="text-xs">NAVIGATION MAP</span>
        <div className="flex space-x-2 text-xs">
          <span className="text-green-400">GPS LOCK</span>
          <span className="text-slate-500">|</span>
          <span>ZOOM: {zoomScale.toFixed(1)}x</span>
        </div>
        {/*Toggle buttons*/}
        <button
        onClick={() => setAutoZoom(!autoZoom)}
        className = {`px-2 py-1 text-xs ${autoZoom ? 'text-green-400 bg-green-900' : 'text-slate-400'}`}
        >
        Toggle Zoom
        </button> 
        <button
          onClick={()=>setAutoRotate(!autoRotate)}
          className={`px-2 py-1 text-xs ${autoRotate ? 'text-green-400-bg-green-900' : 'text-slate-400'}`}
        >
        Toggle Rotation
        </button>
      </div>

      

      {/* Map body */}
      <div className="relative flex-1 bg-slate-800 p-4 overflow-hidden">
        {/* Simulated map grid */}
        <svg 
        className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]" 
        viewBox="0 0 400 300" 
        preserveAspectRatio="xMidYMid meet"
        >
          {/*MAP with transforms*/}
          <g
            transform = {svgTransform}
            style={{
              transition: 'transform 0.5s ease-out' //Cha cha real smooth
            }}
          >
          <image 
            href={mapImg}
            width="400" 
            height="300" 
            preserveAspectRatio="none"
            className="opacity-90" // Dimmed slightly more for better UI contrast
            style={{ filter: 'brightness(0.8) contrast(1.2)' }}
          />

          {/* Grid lines */}
          {[...Array(20)].map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="300" stroke="#374151" strokeWidth="0.3" />
          ))}
          {[...Array(15)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#374151" strokeWidth="0.3" />
          ))}

          {/* Rover position */}
          {autoRotate ? (
            // Rotated rover with direction arrow
            <g transform={`translate(${roverPos.x}, ${roverPos.y}) rotate(${roverHeading})`}>
              <polygon
                points="0,-6 -3,4 0,2 3,4" 
                fill="#ef4444" 
                stroke="#ffffff" 
                strokeWidth="1"
              />
            </g>
          ) : (
            // Static rover circle
            <circle cx={roverPos.x} cy={roverPos.y} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          )}

          {/* Rover text label */}
          <text x={roverPos.x + 10} y={roverPos.y + 5} fill="#ffffff" fontSize="8">
            ROVER {autoRotate ? `${Math.round(roverHeading)}°` : ''}
          </text>

          <circle cx={dronePos.x} cy={dronePos.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWIdth="1" />
          <text x={dronePos.x + 10} y={dronePos.y + 5} fill="#38bdf8" fontSize="8">
            DRONE
          </text>

          {/* Create waypoints from coordinate array*/}
          {coordinates.map((coord, idx) => (
            <React.Fragment key={idx}>
              <circle 
              cx={coord.x} cy={coord.y} 
              r="2" 
              fill={visitedWaypoints.has(coord.id) ? "#22c55e" : "#fbbf24"} 
              />
              <text 
              x={Number(coord.x) + 5} 
              y={Number(coord.y) + 5} 
              fill={visitedWaypoints.has(coord.id) ? "#22c55e" : "#fbbf24"} 
              fontSize="6">
                {visitedWaypoints.has(coord.id) ? "✓" : `WP${idx+1}`}
              </text>
            </React.Fragment>
          ))}

          {/* Path trace */}
          <polyline
            points={pathPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="3,2"
          />
        </g>

        {/*TODO: Arrowhead for indicator */}
          {/* <circle cx="350" cy="100" r="2" fill="#fbbf24" />
          <text x="355" y="105" fill="#fbbf24" fontSize="6">
            WP1
          </text> */}

          {/* Obstacles */}
          {/* <rect x="180" y="200" width="20" height="15" fill="#ef4444" opacity="0.5" />
          <rect x="220" y="180" width="15" height="20" fill="#ef4444" opacity="0.5" /> */}
        </svg>

        {/* Map controls */}
        {/* <div className="absolute top-4 right-4 space-y-1">
          <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">+</button>
          <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">-</button>
        </div> */}

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