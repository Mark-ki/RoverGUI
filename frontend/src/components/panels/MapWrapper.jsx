import React, {useState, useEffect, useRef} from "react";
import MapPanel from './MapPanel';
import {rosServiceInstance} from '../../RosStreamService'; //TODO

const MapWrapper = () => {
  // Initialize coordinate transform utility (eliminates duplicate GPS functions)
  const [roverPos, setRoverPos] = useState({x:200, y:200}); // Value here is fixed, will always be at this.
  const [roverHeading, setRoverHeading] = useState(0); // Calculated here
  const prevRoverGps = useRef(null); // Calculated here
  const [currentRoverGPS, setCurrentRoverGPS] = useState(null); // Current GPS coordinates for tile system

  // Tile system configuration - can be controlled via environment variable or user setting
  const [useTileSystem, setUseTileSystem] = useState(
    process.env.REACT_APP_USE_TILE_SYSTEM === 'true' || false
  );

  const [dronePos, setDronePos] = useState({x:250, y:250}); // Input from ros - will need to figure out later as map centered on rover

  const calculateBearing = (lat1, lng1, lat2, lng2) => {
    const dLng = (lng2 - lng1) * Math.PI/180;
    const lat1Rad = lat1 * Math.PI/180;
    const lat2Rad = lat2 * Math.PI/180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Map ROS GPS updates to local world origin
  useEffect(() => {
    // Call this function when we are passing in GPS coordinates - send in the message of the GPS, programmed using NavSatFix message documentation: https://docs.ros.org/en/noetic/api/sensor_msgs/html/msg/NavSatFix.html 

    const handleRoverGpsUpdate = (message) => {
      try{
      console.log('Rover position update:', message);
      if (message.gnss_fix_ok === true){
        console.warn('No GPS fix available');
        return;
      }

      if (prevRoverGps.current) {
        const heading = calculateBearing(
          prevRoverGps.current.lat,
          prevRoverGps.current.lng,
          message.lat,
          message.lon
        );
      console.log('Calculated rover heading', heading);
      setRoverHeading(heading);
      console.log('Rover Heading as passed to Map Panel', roverHeading);
      }

      // Set GPS coordinates for tile system
      setCurrentRoverGPS({ lat: message.lat, lng: message.lon });
      // console.log("New rover position: ", newPos);
      // console.log("Calling setPrevRoverGPS");
      prevRoverGps.current = {lat: message.lat, lng: message.lon};
    } catch (error) {
      console.error("Error in handleRoverGpsUpdate: ", error);
    }
    }
    rosServiceInstance.subscribe('/rover1/ubx_nav_pvt', 'ublox_ubx_msgs/UBXNavPVT', handleRoverGpsUpdate); //TODO
    return () => {
      rosServiceInstance.unsubscribe('/rover1/ubx_nav_pvt', handleRoverGpsUpdate); //TODO
    };
  }, []);


    return(
        <MapPanel roverPos={roverPos}
                    dronePos={dronePos}
                    roverHeading={roverHeading}
                    roverGPS={currentRoverGPS}
                    useTileSystem={useTileSystem}
            />
    )
};

export default MapWrapper;