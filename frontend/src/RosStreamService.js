import * as ROSLIB from 'roslib';
import { testrosServiceInstance } from './testRoverControlInterfaceService';


class RosService {
  constructor() {
    this.rosConnected = false;
    this.ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });
    
    // Key: topicName, Value: { listenerObject, count: Integer, callbacks: Set }
    this.activeTopics = new Map();

    this.ros.on('connection', () => {console.log('Connected to websocket'); this.rosConnected = true;});
    this.ros.on('error', (error) => console.log('Error connecting: ', error));
    this.ros.on('close', () => {console.log('Connection closed.'); this.rosConnected = false;});
    
    // var reconnectIntervalId = setInterval(function() {
    //     if(!this.rosConnected) {
    //         console.log('Trying to reconnect to websocket server.');
    //         this.ros.connect('ws://localhost:9090');
    //     }

    //     if(this.rosConnected) {
    //         clearInterval(reconnectIntervalId); 
    //     }
    // }, 1000);

  }

  subscribe(topicName, messageType, callback) {
    if (!this.activeTopics.has(topicName)) {
      // 1. First listener: Create the actual ROS listener
      const topicListener = new ROSLIB.Topic({
        ros: this.ros,
        name: topicName,
        messageType: messageType
      });

      // testrosServiceInstance.subscribe('/rover/gps', 'sensor_msgs/NavSatFix', (message) => {
      //   topicListener.publish(message);
      // });
      
      // Temporary code to publish random x coordinates for testing
      setInterval(function() {
        topicListener.publish(({
            data: Math.round(Math.random()*100, 2)
        }));
      }, 2000);

      // 2. Define what happens when data comes in
      topicListener.subscribe((message) => {
        const entry = this.activeTopics.get(topicName);
        console.log(`Received message on ${topicName}:`, message);
        if (entry) {
          entry.callbacks.forEach(cb => cb(message));
        }
      });

      this.activeTopics.set(topicName, {
        listener: topicListener,
        count: 0,
        callbacks: new Set()
      });
    }

    // 3. Increment usage count and add callback
    const entry = this.activeTopics.get(topicName);
    entry.count++;
    entry.callbacks.add(callback);
  }

  unsubscribe(topicName, callback) {
    if (this.activeTopics.has(topicName)) {
      const entry = this.activeTopics.get(topicName);
      
      // Remove specific callback
      entry.callbacks.delete(callback);
      entry.count--;

      // 4. Only actually unsubscribe from ROS if count hits zero
      if (entry.count <= 0) {
        entry.listener.unsubscribe();
        this.activeTopics.delete(topicName);
        console.log(`No more listeners for ${topicName}, unsubscribed.`);
      }
    }
  }

  isConnected() {
    return this.rosConnected;
  }
}

export const rosServiceInstance = new RosService();
