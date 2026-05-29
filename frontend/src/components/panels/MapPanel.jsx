import React, {useState, useMemo, useEffect} from "react";
import mapImg from '../../assets/map_randall.png';
import ChunkRenderer from '../ChunkRenderer';
import SimpleCoordinateTransform from '../../utils/SimpleCoordinateTransform'; // Adjust path as needed
// import { MapPinIcon } from "lucide-react";

const MapPanel = ({roverPos, dronePos, roverHeading, roverGPS = null, useTileSystem = true, missionArea = 'camp_randall'}) => {
  // console.log("Rover GPS", roverGPS);
  // console.log(useTileSystem);
  const [autoZoom, setAutoZoom] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [tileSystemReady, setTileSystemReady] = useState(false);

  // Panning and Zoom states
  const [manualZoomScale, setManualZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({x: 0, y: 0}); // The offsets of mouse panning
  const [isDragging, setIsDragging] = useState(false); // Whether pan is currently occuring
  const [lastMousePos, setLastMousePos] = useState({x: 0, y: 0}) // On 400x400 map

  const [pathData, setPathData] = useState([]); // Path data from backend
  
  useEffect(() => {
    // Case when we want to track the rover
    if (autoZoom) {
      setPanOffset({x: 0, y: 0});
      setManualZoomScale(1);
    }
  }, [autoZoom]);

  useEffect(() => {
    let intervalId;

    const fetchData = () => {
      fetch('http://localhost:3001/path-data')
        .then((res) => res.json())
        .then((resData) => {
          if (resData.status === 'ready') {
            clearInterval(intervalId);
            setPathData(resData.data);

          }
        })
        .catch((err) => {
          console.error('Error fetching data:', err);
        });
    };

    fetchData();

    intervalId = setInterval(fetchData, 3000);

    return () => clearInterval(intervalId);
  }, []);

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
  // Base center of your 400x400 SVG viewBox
  const cx = 200;
  const cy = 200;

  if (useTileSystem) {
    if (autoZoom) {
      // When auto-following, the tile system centers on the rover.
      // We must scale out from the center, then translate the coordinate space to the rover.
      // return `translate(${cx}, ${cy}) scale(${zoomScale}) translate(${-roverPos.x}, ${-roverPos.y})`;
      return '';
    } else {
      // When manually panning, we scale from the center and apply the raw drag offsets.
      return `translate(${cx}, ${cy}) scale(${zoomScale}) translate(${-cx + panOffset.x / zoomScale}, ${-cy + panOffset.y / zoomScale})`;
    }
  }

  // Fallback map layout (Non-tile system)
  return `translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`;
}, [autoZoom, useTileSystem, panOffset, zoomScale]);

// const svgTransform = useMemo(() => {

//     if (useTileSystem){
//       // If not autoZoom then must add panning
//       if (!autoZoom){
//         return `translate(${panOffset.x}, ${panOffset.y})`;
//       }
//       return ''; // If autoZoom enabled ChunkRenderer defaults
//     }

//     // return transform;
//   }, [autoZoom, useTileSystem, panOffset]);

const convertedPathPoints = useMemo(() => {
  if (!pathData || pathData.length === 0 || !roverGPS) return [];

  const MAP_ZOOM_LEVEL = 20; 

  const roverMercator = SimpleCoordinateTransform.gpsToMercator(
    roverGPS.lat,
    roverGPS.lng,
    MAP_ZOOM_LEVEL
  );

  return pathData.map((point, idx) => {
    // For waypoints, only render every other point
    // if(point.label == "waypoint" && idx % 2 === 0){
    //   return null;
    // }
    const lat = parseFloat(point.lat);
    const lon = parseFloat(point.lon);

    if (isNaN(lat) || isNaN(lon)) return null;

    // Get the global pixel coordinate of this CSV waypoint
    const pointMercator = SimpleCoordinateTransform.gpsToMercator(lat, lon, MAP_ZOOM_LEVEL);

    // Calculate exactly how many global pixels away this point is from the rover
    const pixelDeltaX = pointMercator.x - roverMercator.x;
    const pixelDeltaY = pointMercator.y - roverMercator.y;

    // Center of your SVG canvas is (200, 200). 
    return {
      x: 200 + pixelDeltaX,
      y: 200 + pixelDeltaY,
      label: point.label || `WP ${idx + 1}`
    };
  }).filter(Boolean);
}, [pathData, roverGPS]); 

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
          <g transform = {svgTransform} style={{ transition: 'none'}}>
          {/* MAP BACKGROUND - Dynamic tiles or static fallback */}
           {!useTileSystem && (
            <image href={mapImg} width="400" height="400" preserveAspectRatio="none" className="opacity-90" style={{ filter: 'brightness(0.8) contrast(1.2)' }}/>
          )}

            {/* Drone Position*/}
            {/* <circle cx={dronePos.x} cy={dronePos.y} r={4 / zoomScale} fill="#38bdf8" stroke="#ffffff" strokeWidth={1 / zoomScale} />
            <text x={dronePos.x + (10 / zoomScale)} y={dronePos.y + (5 / zoomScale)} fill="#ffffff" fontSize={16 / zoomScale}>
              DRONE
            </text> */}

            {convertedPathPoints.length > 1 && (
          <g>
            {convertedPathPoints.map((pt, idx) => {
              if (idx === convertedPathPoints.length - 1) return null;

              const nextPt = convertedPathPoints[idx + 1];

              // Calculate the distance and angle between this point and the next point.
              const dx = nextPt.x - pt.x;
              const dy = nextPt.y - pt.y;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Convert radians to degrees
              const distance = Math.sqrt(dx * dx + dy * dy);

              const triangleInterval = 50; 
              const triangleCount = Math.floor(distance / triangleInterval);

              return [...Array(triangleCount)].map((_, i) => {
                const t = (i * triangleInterval) / distance;
                
                const arrowX = pt.x + dx * t;
                const arrowY = pt.y + dy * t;
                const markerScale = 1 / zoomScale; 

                return (
                  <g 
                    key={`arrow-${idx}-${i}`} 
                    transform={`translate(${arrowX}, ${arrowY}) rotate(${angle})`}
                  >
                    {/* 6. Draw the Triangle geometry, scaled down inversely by zoomScale */}
                    <g transform={`scale(${markerScale})`}>
                      {/* This is the same geometry shape as your rover arrowhead */}
                      <polygon points="6,0 -4,-3 -2,0 -4,3" fill="#00ffff" />
                    </g>
                  </g>
                );
              });
            })}
          </g>
        )}

        {(() => {
          // Local variables to track the last drawn circle within this loop execution
          let lastDrawnCircleX = null;
          let lastDrawnCircleY = null;
          const MIN_CIRCLE_GAP = 300; // Skip rendering circles if they are closer than 300 pixels apart

          return convertedPathPoints.map((pt, idx) => {
            const radius = 6 / zoomScale;
            const strokeW = 1 / zoomScale;
            const fontSize = 16 / zoomScale;
            const textOffset = 10 / zoomScale;

            const labelColors = {
              waypoint: "#3b82f6",
              gnss: "#eab308", 
              aruco1: "#ef4444", 
              aruco2: "#ec4899",  
              bottle: "#10b981",  
              hammer: "#a855f7",   
              mallet: "#f97316",  
            };

            const markerColor = labelColors[pt.label] ? labelColors[pt.label] : "#3b82f6";
            const shouldShowText = pt.label && pt.label !== "waypoint";

            if (pt.label === "waypoint" && lastDrawnCircleX !== null && lastDrawnCircleY !== null) {
              const dx = pt.x - lastDrawnCircleX;
              const dy = pt.y - lastDrawnCircleY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < MIN_CIRCLE_GAP) {
                return null;
              }
            }

            // Update anchors only when we actually commit to rendering a circle element
            lastDrawnCircleX = pt.x;
            lastDrawnCircleY = pt.y;

            return (
              <g key={`csv-pt-${idx}`}>
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r={radius} 
                  fill={markerColor} 
                  stroke="#0f172a" 
                  strokeWidth={strokeW} 
                />
                
                {shouldShowText && (
                  <text
                    x={pt.x + textOffset}
                    y={pt.y + (fontSize / 3)}
                    fill="#000000"
                    fontSize={fontSize}
                    className="font-mono select-none"
                    style={{ pointerEvents: 'none' }}
                  >
                    {pt.label}
                  </text>
                )}
              </g>
            );
          });
        })()}


            {/* Rover position */}
            {autoRotate ? (
              <g transform={`translate(${roverPos.x}, ${roverPos.y}) rotate(${roverHeading})`}>
                {/* Scale the geometry down relative to zoom */}
                <g transform={`scale(${2 / zoomScale})`}>
                  <polygon points="0,-6 -3,4 0,2 3,4" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                </g>
              </g>
            ) : (
              <circle cx={roverPos.x} cy={roverPos.y} r={4 / zoomScale} fill="#ef4444" stroke="#ffffff" strokeWidth={1 / zoomScale} />
            )}

            <text x={roverPos.x + (10 / zoomScale)} y={roverPos.y + (5 / zoomScale)} fill="#000000" fontSize={16 / zoomScale}>
              ROVER {autoRotate ? `${Math.round(roverHeading)}°` : ''}
            </text>

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