import { useState, useEffect, useRef } from 'react';
import { rosServiceInstance } from './RosStreamService';

export const useRosTopic = (topicName, messageType, updateFrequency = 100) => {
  const [data, setData] = useState(null);
  const latestDataRef = useRef(null);

  useEffect(() => {
    const handleMsg = (msg) => {
      latestDataRef.current = msg;
    };

    rosServiceInstance.subscribe(topicName, messageType, handleMsg);

    const intervalId = setInterval(() => {
      if (latestDataRef.current) {
        //Add more check if necessary
        setData(latestDataRef.current);
      }
    }, updateFrequency);

    // 4. Cleanup
    return () => {
      rosServiceInstance.unsubscribe(topicName, handleMsg);
      clearInterval(intervalId);
    };
  }, [topicName, messageType, updateFrequency]);

  return data;
};