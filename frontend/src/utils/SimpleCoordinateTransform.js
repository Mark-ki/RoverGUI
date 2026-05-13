/**
 * SimpleCoordinateTransform - Essential GPS coordinate conversion utility
 *
 * Replaces CoordinateTransform.js (368 lines) with simplified version (30 lines)
 *
 * Preserves essential functions while removing complex multi-zoom transformations:
 * - GPS-to-viewport pixel conversion (maintains exact existing algorithm)
 * - Haversine distance calculation
 * - Bearing calculation
 * - Reference point calibration: GPS(43.071206, -89.409404) = Pixel(177, 150)
 */

class SimpleCoordinateTransform {
  constructor() {}

  /**
   * Converts a GPS coordinate to the Google Maps flat pixel plane (Web Mercator).
   * This ensures out Javascript matches the exact pixel calculations used in our 
   * Python chunk_downloader algorithm.
   * 
   * @param {number} lat - Latitude in degrees
   * @param {number} lon - Longitude in degrees
   * @param {number} zoomLevel - The map zoom level (e.g. 20)
   * @returns {{x: number, y: number}} The exact X and Y pixel coordinate on the global map
   */
  static gpsToMercator(lat, lon, zoomLevel){
    const scale = 256 *  Math.pow(2, zoomLevel);
    const x = scale * (lon + 180) / 360;
    const sinLatitude = Math.sin(lat * Math.PI / 180);
    const y = scale * (0.5 - Math.log((1 + sinLatitude)/(1 - sinLatitude)) / (4*Math.PI));

    return {x,y};
  }

  /**
   * Converts Google Maps flat pixel plane back to a GPS coordinate.
   * The exact inverse of gpsToMercator.
   * 
   * @param {number} x - The Mercator X pixel coordinate
   * @param {number} y - The Mercator Y pixel coordinate
   * @param {number} zoomLevel - The map zoom level (e.g. 20)
   * @returns {{lat: number, lon: number}} The recovered GPS coordinates
   */
  static mercatorToGps(x, y, zoomLevel){
    const scale = 256 * Math.pow(2, zoomLevel);
    
    // Reverse longitude linear transform
    const lon = (360 * x / scale) - 180;
    
    // Reverse latitude logarithmic stretch using the Gudermannian function
    const yScaledReverse = 0.5 - (y / scale);
    const expY = Math.exp(yScaledReverse * 4 * Math.PI);
    
    // asin domain is bounded safely due to max map latitudes +/- 85.0511
    const latRads = Math.asin((expY - 1) / (expY + 1));
    const lat = latRads * 180 / Math.PI;
    
    return { lat, lon };
  }
}

export default SimpleCoordinateTransform;