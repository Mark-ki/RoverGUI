import React, {useState, useMemo, useEffect} from "react";
import mapImg from '../../assets/map_randall.png';
import ChunkRenderer from '../ChunkRenderer';
// import { MapPinIcon } from "lucide-react";

const MapPanel = ({roverPos, dronePos, roverHeading, roverGPS = null, useTileSystem = false, missionArea = 'camp_randall'}) => {
  const [autoZoom, setAutoZoom] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [tileSystemReady, setTileSystemReady] = useState(false);

  // Panning and Zoom states
  const [manualZoomScale, setManualZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({x: 0, y: 0}); // The offsets of mouse panning
  const [isDragging, setIsDragging] = useState(false); // Whether pan is currently occuring
  const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0}) // On 400x400 map
  
  useEffect(() => {
    // Case when we want to track the rover
    if (autoZoom) {
      setPanOffset({x: 0, y: 0});
      setManualZoomScale(1);
    }
  }, [autoZoom]);
  
  const zoomScale = useMemo(() => {
    if (!autoZoom) return manualZoomScale;
    return 1; // Default scale when autoZoom is enabled
  }, [autoZoom, manualZoomScale]);

  // Calculate zoom level for tile system based on auto-zoom scale
  const tileZoomLevel = useMemo(() => {
    // Convert zoomScale to appropriate tile zoom level (16-20)
    // zoomScale ranges from 0.5 to 4.0, map to zoom levels
    const minZoom = 16;
    const maxZoom = 20;
    const normalizedScale = Math.max(0.5, Math.min(4.0, zoomScale));

    // Linear interpolation: higher zoomScale = higher zoom level
    const zoom = minZoom + ((normalizedScale - 0.5) / (4.0 - 0.5)) * (maxZoom - minZoom);
    return Math.round(zoom);
  }, [zoomScale]);

  // Calculate transforms
  const svgTransform = useMemo(() => {

    if (useTileSystem){
      // If not autoZoom then must add panning
      if (!autoZoom){
        return `translate(${panOffset.x}, ${panOffset.y})`;
      }
      return ''; // If autoZoom enabled ChunkRenderer defaults
    }
    
    // if (autoZoom) {
    //   transform += `translate(${centerX}, ${centerY})`;
    //   transform += ` scale(${zoomScale})`;
    //   // Translate to center on rover
    //   transform += ` translate(${-roverPos.x}, ${-roverPos.y})`;
    // }

    // return transform;
  }, [autoZoom, useTileSystem, panOffset]);

  /* 
    Handlers for Mouse / Trackpad events
  */
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMousePos({x: e.clientX, y: e.clientY});
    // If user manually interacts then toggle autoZoom to false
    setAutoZoom(false); // Look into how much this affects UX
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return; // No click = no pan
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setPanOffset(prev => ({x: prev.x + dx, y: prev.y + dy}));
    setLastMousePos({x: e.clientX, y: e.clientY});
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleWheel = (e) => {
    // Only zoom when scrolling over the map
    setAutoZoom(false);
    const zoomSensitivity = -0.002 // Adjust according to feel
    setManualZoomScale(prev => {
      const nextScale = prev + (e.deltaY * zoomSensitivity);
      return Math.max(0.02, Math.min(nextScale, 2.2)); // Minimum zoom of 0.2x and max limit of 5.0x
    });
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700 w-full h-full">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-2 flex justify-between items-center">
        <span className="text-xs">NAVIGATION MAP</span>
        <div className="flex space-x-2 text-xs">
          {useTileSystem && roverGPS ? (
            <>
              <span className={tileSystemReady ? "text-green-400" : "text-yellow-400"}>
                {tileSystemReady ? "TILES READY" : "LOADING TILES"}
              </span>
              <span className="text-slate-500">|</span>
              <span>ZOOM: L{tileZoomLevel} ({zoomScale.toFixed(1)}x)</span>
            </>
          ) : (
            <>
              <span className="text-green-400">GPS LOCK</span>
              <span className="text-slate-500">|</span>
              <span>ZOOM: {zoomScale.toFixed(1)}x</span>
            </>
          )}
        </div>
        <div className="space-x-2">
          {/*Toggle buttons*/} 
          <button
            onClick={() => setAutoZoom(!autoZoom)}
            className = {`px-2 py-1 text-xs ${autoZoom ? 'text-green-400 bg-green-900' : 'text-slate-400 border border-slate-700'}`}
          >
          {autoZoom ? 'Auto-Follow' : 'Manual View'}
          </button>
          <button
            onClick={()=>setAutoRotate(!autoRotate)}
            className={`px-2 py-1 text-xs ${autoRotate ? 'text-green-400 bg-green-900' : 'text-slate-400 border border-slate-700'}`}
          >
          Rotation
          </button>
        </div>
      </div>
      
      {/* Map body */}
      <div 
      className={`relative flex-1 bg-slate-800 p-4 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      >
        {/* Simulated map grid */}
        <svg 
        className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] pointer-events-none" 
        viewBox="0 0 400 400" 
        >
          {/* MAP background */}
          {useTileSystem && roverGPS ? (
            <foreignObject 
            x="-400" // Adjust the center by -400 so it matches the 200, 200 svg center
            y="-400" 
            width="1200" // Huge bounding box parameters for fitting 512x512 px
            height="1200"
            style={{ padding:0, margin: 0, border: 'none'}}
            className="m-0 p-0 block leading-none"
            >
              <ChunkRenderer
                centerGPS={roverGPS}
                zoomScale={zoomScale}
                fallbackImage={mapImg}
                onTilesReady={setTileSystemReady}
                panOffset={panOffset}
                missionArea={missionArea}
              />
            </foreignObject>
          ) : null } 
          
          {/*static components group*/}
          <g transform = {svgTransform} style={{ transition: autoZoom ? 'transform 0.5s ease-out' : 'none'}}>
          {/* MAP BACKGROUND - Dynamic tiles or static fallback */}
           {!useTileSystem && (
            <image href={mapImg} width="400" height="400" preserveAspectRatio="none" className="opacity-90" style={{ filter: 'brightness(0.8) contrast(1.2)' }}/>
          )}

          {/* Grid lines */}
          {/* {[...Array(20)].map((_, i) => (
            <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="400" stroke="#374151" strokeWidth="0.3" />
          ))}
          {[...Array(15)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="#374151" strokeWidth="0.3" />
          ))} */}

          {/* Rover position */}
          {autoRotate ? (
            // Rotated rover with direction arrow
            <g transform={`translate(${roverPos.x}, ${roverPos.y}) rotate(${roverHeading})`}>
              <polygon points="0,-6 -3,4 0,2 3,4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            </g>
          ) : (
            // Static rover circle
            <circle cx={roverPos.x} cy={roverPos.y} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          )}

          {/* Rover text label */}
          <text x={roverPos.x + 10} y={roverPos.y + 5} fill="#ffffff" fontSize="8">
            ROVER {autoRotate ? `${Math.round(roverHeading)}°` : ''}
          </text>

          {/*Drone Position */}
          {/* <circle cx={dronePos.x} cy={dronePos.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
          <text x={dronePos.x + 10} y={dronePos.y + 5} fill="#38bdf8" fontSize="8">DRONE</text> */}
        </g>
        </svg>

        {/* Coordinates display */}
        <div className="absolute bottom-4 left-4 text-xs space-y-1 pointer-events-none">
          {roverGPS ? (
            <>
              <div className="bg-slate-900/80 px-1">LAT: {roverGPS.lat.toFixed(6)}°</div>
              <div className="bg-slate-900/80 px-1">LON: {roverGPS.lng.toFixed(6)}°</div>
            </>
          ) : (
            <>
              <div className="bg-slate-900/80 px-1">NO GPS LINK</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPanel;