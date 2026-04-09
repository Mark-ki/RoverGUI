import React, {useState, useEffect, useRef} from "react";
import MapPanel from './MapPanel';
import {rosServiceInstance} from '../../RosStreamService';


const MapWrapper = () => {
  // The coordiantes for the central point (google maps pin on the map)
  const MDRS_COORDINATES = {
    // Camp randall
    lat: 43.07120641748063,
    lon: -89.40940407925282

    // Actual MDRS coords
    // lat: 38.406387616586926,
    // lon: -110.79167705199379
  }

  const PIXELS_PER_METER = 2.4347041909; // Calibrated

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) + 
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI/180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }

  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI/180;
    console.log("dlon", dLon);
    const lat1Rad = lat1 * Math.PI/180; // Start
    const lat2Rad = lat2 * Math.PI/180; // End
    console.log("lat1rad", lat1Rad);
    console.log("lat2Rad", lat2Rad);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  const convertGpsToMap = (latitude, longitude) => {
    // Calc distance and bearings from MDRS pin
    const distance = haversineDistance(
      MDRS_COORDINATES.lat,
      MDRS_COORDINATES.lon,
      latitude,
      longitude
    );

    const bearing = calculateBearing(
      MDRS_COORDINATES.lat,
      MDRS_COORDINATES.lon,
      latitude,
      longitude
    );
    console.log("Bearing in GPS to MAP function", bearing);

    // Convert to x, y offset from MDRS pin (177, 170)
    const bearingRad = bearing * Math.PI / 180;
    const pixelDistance = distance * PIXELS_PER_METER;

    // location of MDRS on current screenshot - change if you change image
    const MDRS_MAP_LOCATION_PX_X = 245
    const MDRS_MAP_LOCATION_PX_Y = 43

    const x = MDRS_MAP_LOCATION_PX_X + (pixelDistance * Math.sin(bearingRad));
    const y = MDRS_MAP_LOCATION_PX_Y - (pixelDistance * Math.cos(bearingRad));

    return {
      x: Math.round(Math.max(0, Math.min(400, x))),
      y: Math.round(Math.max(0, Math.min(300, y)))
    }
  }
  const [roverPos, setRoverPos] = useState({x:300, y:120}); // Input from ros - value here is default
  const [roverHeading, setRoverHeading] = useState(0); // Calculated here
  const prevRoverGps = useRef(null); // Calculated here

  const [dronePos, setDronePos] = useState({x:350, y:140}); // Input from ros

  const [allWaypoints] = useState([
    {x: 280, y: 150, id: 1}, 
    { x: 350, y: 189, id: 2}, 
    { x: 380, y: 250, id:3}, 
    { x: 320, y: 210, id:4},
    { x: 310, y: 224, id:5}, 
    { x: 297, y: 200, id:6}, 
    { x: 190, y: 180, id:7}, 
    { x:360, y: 290, id:8}
  ])
  

  const [visitedWaypoints, setVisitedWaypoints] = useState(new Set());
  const [currentTarget, setCurrentTarget] = useState(0); //Idx of curr targeted waypoint
  
  const remainingWaypoints = allWaypoints.filter(wp => !visitedWaypoints.has(wp.id));
  useEffect(() => {
    // Call this function when we are passing in GPS coordinates - send in the message of the GPS, programmed using NavSatFix message documentation: https://docs.ros.org/en/noetic/api/sensor_msgs/html/msg/NavSatFix.html 
    const handleRoverGpsUpdate = (message) => {
      try{
      console.log('Rover position update:', message);
      if (message.status.status < 0){
        console.warn('No GPS fix available');
        return;
      }
      const newPos = convertGpsToMap(message.latitude, message.longitude);

      if (prevRoverGps.current) {
        const heading = calculateBearing(
          prevRoverGps.current.lat,
          prevRoverGps.current.lon,
          message.latitude,
          message.longitude
        );
      console.log('Calculated rover heading', heading);
      setRoverHeading(heading);
      console.log('Rover Heading as passed to Map Panel', roverHeading);
      }
      console.log(`GPS: ${message.latitude}, ${message.longitude} -> Map: ${newPos.x}, ${newPos.y}`); // DEBUG
      // console.log("Calling setRoverPos");
      setRoverPos(newPos);
      // console.log("New rover position: ", newPos);
      // console.log("Calling setPrevRoverGPS");
      prevRoverGps.current = {lat: message.latitude, lon: message.longitude}; // Set at end so next call will reuse this value, when roverPos updates
      // console.log("Prev Rover GPS:", prevRoverGps);
      // console.log("Calling checkwaypoint reached");
      checkWaypointReached(newPos);
      // console.log("Everything was succeys.");
    } catch (error) {
      console.error("Error in handleRoverGpsUpdate: ", error);
    }
    }
    rosServiceInstance.subscribe('/fix', 'sensor_msgs/NavSatFix', handleRoverGpsUpdate);
    return () => {
      rosServiceInstance.unsubscribe('/fix', handleRoverGpsUpdate);
    };
  }, []);



  const checkWaypointReached = (currentPos) => {
    if (remainingWaypoints.length === 0) return;

    const targetWaypoint = remainingWaypoints[0]; // First unvisited
    const distance = Math.sqrt(
      Math.pow(targetWaypoint.x - currentPos.x, 2) + 
      Math.pow(targetWaypoint.y - currentPos.y, 2)
    );

    const WAYPOINT_THRESH = 3; //TODO - adjust as required - depending on how big it looks like

    if (distance < WAYPOINT_THRESH){
      console.log(`Reached waypoint ${targetWaypoint.id}!`);
      setVisitedWaypoints(prev => new Set([...prev], targetWaypoint.id));
    } 

  };

    return(
        <MapPanel roverPos={roverPos} 
                    dronePos={dronePos}
                    coordinates={remainingWaypoints}
                    visitedWaypoints={visitedWaypoints} // for Visited
                    roverHeading={roverHeading} // for rover direction
            /> 
    )
};

export default MapWrapper;