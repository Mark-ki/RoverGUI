# RoverGUI Tile System Architecture (Frontend)

This document provides a high-level conceptual overview of how the offline satellite map rendering system works in the RoverGUI. 

Rather than using an external library like Leaflet or Google Maps JS (which require constant internet access and fight with custom React rendering), this system is built entirely from scratch using pure React, SVG, and Mathematics. It is specifically designed to function offline during rover missions.

## The Source of Truth
Before the system even boots up, map data is pre-downloaded using the `chunk_downloader.py` tool. This Python script downloads a grid of `512x512` pixel satellite images (chunks) from Google Maps at **Zoom Level 20** and generates a `metadata.json` file. Each chunk is named mathematically based on its exact center GPS coordinate. **This folder of files acts as the undisputed physical source of truth for the frontend.**

---

## 1. Data Ingestion (`MapWrapper.jsx`)
The process begins at the wrapper level. The `MapWrapper` acts as the bridge between the Rover's physical hardware (via the ROS bridge) and the React frontend.
- It constantly listens to the `/rover1/ubx_nav_pvt` ROS topic for new GPS coordinates.
- It calculates the rover's physical heading/bearing by comparing its new GPS coordinate against its previous one.
- It funnels this live data (Latitude, Longitude, and Heading) down to the visual layer.

## 2. Mathematical Translation (`SimpleCoordinateTransform.js`)
Because the Earth is a sphere and our computer screens are flat, we cannot simply map Latitude/Longitude directly to X/Y screen pixels. 
- We use the **Web Mercator Projection** (EPSG:3857) to flatten the earth.
- This utility contains pure mathematical formulas (the Gudermannian function) to translate GPS coordinates directly into flat pixel coordinates.
- It guarantees that the React frontend is using the the *exact same* mathematical translation as the Python downloader script, ensuring pixel-perfect alignment.

## 3. The Viewport & Interaction (`MapPanel.jsx`)
`MapPanel` manages the user interface and the "camera" observing the map.
- Think of `MapPanel` as a `400x400` pixel window cut out of a piece of cardboard. Behind this cardboard window exists the infinite world.
- It captures all human interaction: mouse dragging (panning), trackpad scrolling (zooming), and toggling the "Auto-Follow" camera lock.
- It is responsible for rendering the static SVG overlays layer, which draws the red Rover arrow and the blue Drone icon on top of the world.

## 4. The Render Engine (`ChunkRenderer.jsx`)
This is the heart of the system. Its job is to figure out which chunks of the map belong inside the `400x400` window and dynamically stitch them together without gaps.
- **Distance Calculation:** It takes the Rover's exact GPS coordinate and converts it to Web Mercator pixels. It does the same for every available chunk listed in `metadata.json`.
- **Culling:** By calculating the distance between the Rover and the Chunks, it figures out which chunks are close enough to be visible on the screen. It ignores (culls) chunks that are miles away to save computer memory.
- **Dynamic Loading:** As the user clicks and drags the map (Pan Offset), it mathematically widens its search radius, fetching new map chunks asynchronously before they even slide into view.
- **The CSS Hack:** To stitch the `512x512` images together flawlessly, it places them inside a deliberately oversized `1200x1200` invisible container. This prevents web browsers from aggressively "squishing" the images to fit the smaller screen size. 
- **Absolute Positioning:** Instead of relying on HTML layout flows, it tells every single chunk exactly how many pixels to sit offset from the mathematical center, ensuring the images form a perfect, gapless grid.

---

### Summary of the Data Flow
1. **ROS** says: *"The rover is at Lat X, Lon Y."*
2. **Transform** says: *"On a flat map at Zoom 20, that corresponds to Pixel 1000000, Pixel 2000000."*
3. **MapPanel** says: *"I will keep Pixel 1000000, 2000000 perfectly centered in the middle of my 400x400 screen."*
4. **Renderer** says: *"I will find all image chunks that sit within 400 pixels of 1000000, 2000000, and mathematically staple them relative to that center point."*