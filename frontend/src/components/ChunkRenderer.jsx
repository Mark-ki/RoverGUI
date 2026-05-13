import React, { useState, useEffect, useMemo } from 'react';
import SimpleCoordinateTransform from '../utils/SimpleCoordinateTransform';
// IMPORTANT: If you want no backend at all, move your `chunks` folder into `frontend/public/chunks/`
// and change this URL to just `/chunks/`
const CHUNKS_BASE_URL = '/chunks/'; 

const ChunkRenderer = ({ centerGPS, zoomScale = 1, fallbackImage, onTilesReady }) => {
  const [metadata, setMetadata] = useState(null);
  const [loadedChunks, setLoadedChunks] = useState(new Map());
  const [error, setError] = useState(false);

  // Load metadata.json once on mount
  useEffect(() => {
    fetch(`${CHUNKS_BASE_URL}metadata.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMetadata(data);
        setError(false);
      })
      .catch(err => {
        console.warn('Chunks not available, using fallback:', err.message);
        setError(true);
      });
  }, []);

  // Calculate visible chunks based on rover position and zoom
  const visibleChunks = useMemo(() => {
    if (!metadata || !centerGPS) return [];

    const chunks = [];
    const MAP_ZOOM_LEVEL = 20; // Zoom level used for download
    const roverPx = SimpleCoordinateTransform.gpsToMercator(centerGPS.lat, centerGPS.lng, MAP_ZOOM_LEVEL);
    const pixelThresh = (400/zoomScale) + 256;    

    Object.values(metadata.chunks || {}).forEach(chunk => {
      // Use fallback if centerGPS isn't explicitly defined in metadata
      const chunkCenter = chunk.centerGPS
      const chunkPx = SimpleCoordinateTransform.gpsToMercator(chunkCenter[0], chunkCenter[1], MAP_ZOOM_LEVEL);

      const dxPixels = chunkPx.x - roverPx.x;
      const dyPixels = chunkPx.y - roverPx.y;

      // Check if chunk overlaps viewport
      if (Math.abs(dxPixels) <= pixelThresh && Math.abs(dyPixels) <= pixelThresh) {
        chunks.push({
            ...chunk,
            dxPixels: dxPixels,
            dyPixels: dyPixels
        });
      }
    });

    return chunks;
  }, [metadata, centerGPS, zoomScale]);

  // Load chunk images safely avoiding loops and duplicate fetches
  useEffect(() => {
    visibleChunks.forEach(chunk => {
        setLoadedChunks(prev => {
            // Only kick off a fetch if we haven't seen this chunk yet
            if (prev.has(chunk.filename)) return prev;
            
            const img = new Image();
            img.onload = () => {
                    setLoadedChunks(current => {
                        const next = new Map(current);
                        next.set(chunk.filename, { image: img, chunk });
                        return next;
                    });
            };
            img.onerror = () => {
                console.warn(`Failed to load chunk: ${chunk.filename}`);
            };
            img.src = `${CHUNKS_BASE_URL}${chunk.filename}`;
            
            // Mark as "loading" instantly so the next tick doesn't duplicate the request
            const next = new Map(prev);
            next.set(chunk.filename, { loading: true });
            return next;
        });
    });
  }, [visibleChunks]); // Re-runs ONLY when visible view boundary changes
  useEffect(() => {
    if (onTilesReady){
      if (visibleChunks.length > 0) {
        const allLoaded = visibleChunks.every(chunk => {
          const loaded = loadedChunks.get(chunk.filename);
          return loaded && !loaded.loading
        });
        onTilesReady(allLoaded);
      } else {
        onTilesReady(false);
      }
    }
  }, [visibleChunks, loadedChunks, onTilesReady])
  // Render fallback image if no metadata or error
  if (error || !metadata || visibleChunks.length === 0) {
    return <img src={fallbackImage} width="400" height="400" className="object-cover" alt="Map Fallback" />;
  }

  // Phase 3: Exact Offset Rendering
  return (
    <div className="relative overflow-hidden m-0 p-0 border-0 leading-none" style={{ width: 1200, height: 1200, backgroundColor: '#e2e8f0' }}>     
      {visibleChunks.map(chunk => {
        const loaded = loadedChunks.get(chunk.filename);
        if (!loaded || loaded.loading) return null;

        const TILE_SIZE = 512;

        const renderWidth = TILE_SIZE * zoomScale;
        const renderHeight = TILE_SIZE * zoomScale;

        // Transform dx/dy into screen pixels offset from the center 
        // dx is East (+X), dy is North (-Y in CSS)
        const xOffsetPixels = chunk.dxPixels * zoomScale;
        const yOffsetPixels = chunk.dyPixels * zoomScale;

        // Center of the wrapper is (200, 150)
        // Position chunk so its mathematical center aligns perfectly on the view
        const left = 600 + xOffsetPixels - (renderWidth / 2);
        const top = 600 + yOffsetPixels - (renderHeight / 2);

        return (
          <img
            key={chunk.filename}
            src={loaded.image.src}
            className="absolute object-cover max-w-none block m-0 p-0"
            style={{
              width: `${renderWidth}px`,
              height: `${renderHeight}px`,
              left: `${left}px`,
              top: `${top}px`
            }}
            alt={`Chunk ${chunk.filename}`}
          />
        );
      })}
    </div>
  );
};

export default ChunkRenderer;