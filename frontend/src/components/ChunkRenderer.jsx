import React, { useState, useEffect, useMemo } from 'react';
import SimpleCoordinateTransform from '../utils/SimpleCoordinateTransform';
// IMPORTANT: If you want no backend at all, move your `chunks` folder into `frontend/public/chunks/`
// and change this URL to just `/chunks/`

const ChunkRenderer = ({ centerGPS, zoomScale = 1, fallbackImage, onTilesReady, panOffset = {x: 0, y: 0}, missionArea = 'camp_randall' }) => {
  console.log("Chunk Renderer called");
  const [metadata, setMetadata] = useState(null);
  const [loadedChunks, setLoadedChunks] = useState(new Map());
  const [error, setError] = useState(false);
  console.log(missionArea)
  const chunksBaseUrl = `/chunks/${missionArea}/`;

  const [loadedKeys, setLoadedKeys] = useState(new Set());
  // Load metadata.json once on mount
  useEffect(() => {
    fetch(`${chunksBaseUrl}metadata.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const preFetchedChunks = [];
        Object.values(data.chunks || {}).forEach(chunk => {
          const center = chunk.centerGPS;
          if (!center) return;
          const px = SimpleCoordinateTransform.gpsToMercator(center[0], center[1], 20);
          preFetchedChunks.push({...chunk, centerGPS: center, basePxX: px.x, basePxY: px.y});
        });
        setMetadata({... data, preFetchedChunks});
        setError(false);
        setLoadedKeys(new Set());
      })
      .catch(err => {
        console.warn(`Chunks for ${missionArea} not available, using fallback:`, err.message);
        setError(true);
      });
  }, [chunksBaseUrl, missionArea]);

  // Calculate visible chunks based on rover position, zoom and panning
  const visibleChunks = useMemo(() => {
    if (!metadata || !metadata.preFetchedChunks || !centerGPS) return [];

    // const chunks = [];
    const MAP_ZOOM_LEVEL = 20; // Zoom level used for download
    const roverPx = SimpleCoordinateTransform.gpsToMercator(centerGPS.lat, centerGPS.lng, MAP_ZOOM_LEVEL);
    
    // center to edge distance * 2 for smoothness, adjusted for zoom level along with edge spilling for preventing edge culling, and pan anchors
    // const pixelThresh = (400/zoomScale) + 256 + (Math.max(Math.abs(panOffset.x), Math.abs(panOffset.y)) / zoomScale);    
       const pixelThresh = (400/zoomScale) + 300;    
    const visible = [];

    for (let i = 0; i < metadata.preFetchedChunks.length; i++) {
        const chunk = metadata.preFetchedChunks[i];
        const dxPixels = chunk.basePxX - roverPx.x;
        const dyPixels = chunk.basePxY - roverPx.y;

        const distanceToScreenCenterX = dxPixels + (panOffset.x / zoomScale);
        const distanceToScreenCenterY = dyPixels + (panOffset.y / zoomScale);

        if (Math.abs(distanceToScreenCenterX) <= pixelThresh && 
            Math.abs(distanceToScreenCenterY) <= pixelThresh) {
          visible.push({ ...chunk, dxPixels, dyPixels });
        }
    }

    return visible;
  }, [metadata, centerGPS, zoomScale, panOffset]);

  // // Load chunk images safely avoiding loops and duplicate fetches
  // useEffect(() => {
  //   visibleChunks.forEach(chunk => {
  //       setLoadedChunks(prev => {
  //           // Only kick off a fetch if we haven't seen this chunk yet
  //           if (prev.has(chunk.filename)) return prev;
            
  //           const img = new Image();
  //           img.onload = () => {
  //                   setLoadedChunks(current => {
  //                       const next = new Map(current);
  //                       next.set(chunk.filename, { image: img, chunk });
  //                       return next;
  //                   });
  //           };
  //           img.onerror = () => {
  //               console.warn(`Failed to load chunk: ${chunk.filename}`);
  //           };
  //           img.src = `${chunksBaseUrl}${chunk.filename}`;
            
  //           // Mark as "loading" instantly so the next tick doesn't duplicate the request
  //           const next = new Map(prev);
  //           next.set(chunk.filename, { loading: true });
  //           return next;
  //       });
  //   });
  // }, [visibleChunks]); // Re-runs ONLY when visible view boundary changes
  
  useEffect(() => {
    if (onTilesReady){
      if (visibleChunks.length > 0) {
        const allLoaded = visibleChunks.every(chunk => loadedKeys.has(chunk.filename));
        onTilesReady(allLoaded);
      } else {
        onTilesReady(false);
      }
    }
  }, [visibleChunks, loadedKeys, onTilesReady])
  // Render fallback image if no metadata or error
  if (error || !metadata) {
    // console.log(error)
    return <img src={fallbackImage} width="400" height="400" className="object-cover" alt="Map Fallback" />;
  }

  // Phase 3: Exact Offset Rendering
  return (
    <div className="relative overflow-hidden m-0 p-0 border-0 leading-none" style={{ width: 1200, height: 1200, backgroundColor: '#e2e8f0' }}>     
      {visibleChunks.map(chunk => {
        // const loaded = loadedChunks.get(chunk.filename);
        // if (!loaded || loaded.loading) return null;

        const TILE_SIZE = 512;

        const renderWidth = TILE_SIZE * zoomScale;
        const renderHeight = TILE_SIZE * zoomScale;

        // Transform dx/dy into screen pixels offset from the center 
        // dx is East (+X), dy is North (Y in CSS)
        const xOffsetPixels = chunk.dxPixels * zoomScale;
        const yOffsetPixels = chunk.dyPixels * zoomScale; // Check this if inverse rendering issue occurs

        // Center of the wrapper is (200, 200)
        // Position chunk so its mathematical center aligns perfectly on the view
        const left = 600 + xOffsetPixels - (renderWidth / 2) + panOffset.x;
        const top = 600 + yOffsetPixels - (renderHeight / 2) + panOffset.y;

        return (
          <img
            key={chunk.filename}
            src={`${chunksBaseUrl}${chunk.filename}`}
            loading="lazy" // Auto cancels pending reqs
            decoding="async" // Prevents main thread from freezing
            className={`absolute object-cover max-w-none block m-0 p-0 transition-opacity duration-300 ${loadedKeys.has(chunk.filename) ? 'opacity-100':'opacity-0'}`}
            style={{
              width: `${renderWidth}px`,
              height: `${renderHeight}px`,
              left: `${left}px`,
              top: `${top}px`
            }}
            onLoad={() => {
              setLoadedKeys(prev => {
                const updated = new Set(prev);
                updated.add(chunk.filename);
                return updated;
              });
            }}
            alt={`Chunk ${chunk.filename}`}
          />
        );
      })}
    </div>
  );
};

export default ChunkRenderer;