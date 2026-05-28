import React, {useState, useEffect, useRef} from "react";
import MapPanel from './MapPanel';
import {rosServiceInstance} from '../../RosStreamService'; //TODO
import { useRosTopic } from "../../useRosTopic";

const MapWrapper = () => {
  // Initialize coordinate transform utility (eliminates duplicate GPS functions)
  const [roverPos, setRoverPos] = useState({x:200, y:200}); // Value here is fixed, will always be at this.
  const prevRoverGps = useRef(null); // Calculated here
  const [currentRoverGPS, setCurrentRoverGPS] = useState(null); // Current GPS coordinates for tile system
  const [missionArea, setMissionArea] = useState('camp_randall') // Change according to mission TODO
  // Tile system configuration - can be controlled via environment variable or user setting
  const [useTileSystem, setUseTileSystem] = useState(
    process.env.REACT_APP_USE_TILE_SYSTEM === 'true' || false
  );

  const [dronePos, setDronePos] = useState({x:250, y:250}); // Input from ros - will need to figure out later as map centered on rover

  const roverHeading = useRosTopic('/heading', 'std_msgs/Float32');
  

  // Map ROS GPS updates to local world origin
  useEffect(() => {
    // Call this function when we are passing in GPS coordinates - send in the message of the GPS, programmed using NavSatFix message documentation: https://docs.ros.org/en/noetic/api/sensor_msgs/html/msg/NavSatFix.html 

    const handleRoverGpsUpdate = (message) => {
      try{
      // console.log('Rover position update:', message);
      if (message.gnss_fix_ok === true){
        console.warn('No GPS fix available');
        return;
      }

      // Set GPS coordinates for tile system
      setCurrentRoverGPS({ lat: message.lat * Math.pow(10, -7), lng: message.lon * Math.pow(10, -7) });
      // console.log("New rover position: ", newPos);
      // console.log("Calling setPrevRoverGPS");
      prevRoverGps.current = {lat: message.lat * Math.pow(10, -7), lng: message.lon * Math.pow(10, -7)};
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
                    roverHeading={roverHeading?.data || 0}
                    roverGPS={currentRoverGPS}
                    useTileSystem={useTileSystem}
                    missionArea={missionArea}
            />
    )
};

export default MapWrapper;