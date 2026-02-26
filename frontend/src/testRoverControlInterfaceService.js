import { ListEnd } from 'lucide-react';
import * as ROSLIB from 'roslib';

class RosService{
    constructor() {
        this.rosConnected = false;
        this.ros = new ROSLIB.Ros({ url: 'ws://localhost:8080'});

        this.activeTopics = new Map();

        this.GPS_BOUNDS = {
            // Camp Randall
            topLeft: {lat: 43.07137875207218, lon: -89.4105193240987 },
            bottomRight: {lat: 43.069450361326695, lon: -89.40908605959572 }
            // MDRS
            // topLeft: {lat: 38.40866592666396, lon: -110.7981725030884 },
            // bottomRight: {lat: 38.404310912256484, lon: -110.78619912271598 }
        };

        // Simulated rover state
        this.simulatedRover = {
            // Camp Randall
            lat: 43.07120641748063,  // Start at MDRS
            lon: -89.40940407925282,
            heading: 0,               // degrees
            speed: 0.00002
            // MDRS
            // lat: 38.406387616586926,  // Start at MDRS
            // lon: -110.79167705199379,
            // heading: 0,               // degrees
            // speed: 0.00002 // degrees per step
        };

        this.ros.on('connection', () => {
            console.log('Connected to websocket');
            this.rosConnected = true;
        });
        this.ros.on('error', (error) => console.log("Error connection: ", error));
        this.ros.on('close', () => {
            console.log("Connection closed")
            this.rosConnected = false;
        });
    }

    generateGpsMovement(){
        if (Math.random() < 0.3){
            this.simulatedRover.heading = Math.random() * 360;
        }

        const headingRad = this.simulatedRover.heading * Math.PI/180;
        const latChange = Math.cos(headingRad) * this.simulatedRover.speed;
        const lonChange = Math.sin(headingRad) * this.simulatedRover.speed;

        this.simulatedRover.lat += latChange;
        this.simulatedRover.lon += lonChange;

        if (this.simulatedRover.lat > this.GPS_BOUNDS.topLeft.lat){
            this.simulatedRover.lat = this.GPS_BOUNDS.topLeft.lat;
            this.simulatedRover.heading = 180 - this.simulatedRover.heading;
        }
        if (this.simulatedRover.lat < this.GPS_BOUNDS.bottomRight.lat){
            this.simulatedRover.lat = this.GPS_BOUNDS.bottomRight.lat;
            this.simulatedRover.heading = 180 - this.simulatedRover.heading;
        }
        if (this.simulatedRover.lon < this.GPS_BOUNDS.topLeft.lon){
            this.simulatedRover.lon = this.GPS_BOUNDS.topLeft.lon;
            this.simulatedRover.heading = 180 - this.simulatedRover.heading;
        }
        if (this.simulatedRover.lon > this.GPS_BOUNDS.bottomRight.lon){
            this.simulatedRover.lon = this.GPS_BOUNDS.bottomRight.lon;
            this.simulatedRover.heading = 180 - this.simulatedRover.heading;
        }

        return {
            latitude: this.simulatedRover.lat,
            longitude: this.simulatedRover.lon
        };
    }

    // Create NavSatFix message
    createNavSatFixMessage(lat, lon) {
        return {
            header: {
        stamp: { 
          sec: Math.floor(Date.now() / 1000),
          nanosec: (Date.now() % 1000) * 1000000
        },
        frame_id: "gps"
      },
        status: {
            status: 0,
            service: 1
        },
        latitude: lat,
        longitude: lon,
        altitude: 1350.5,
        position_covariance: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        position_covariance_type: 1
        };
    }

    subscribe(topicName, messageType, callback){
        if (!this.activeTopics.has(topicName)){
            const topicListener = new ROSLIB.Topic({
                ros: this.ros,
                name: topicName,
                messageType: messageType
            });

            if (topicName === '/rover/gps' && messageType === 'sensor_msgs/NavSatFix'){
                console.log('Starting GPS simulation for testing ...');

                const gpsInterval = setInterval(() => {
                    const gpsPos = this.generateGpsMovement();
                    const navSatMessage = this.createNavSatFixMessage(gpsPos.latitude, gpsPos.longitude);

                    console.log(`Simulated GPS coordinates: ${gpsPos.latitude.toFixed(8)}, ${gpsPos.longitude.toFixed(8)}`);

                    const entry = this.activeTopics.get(topicName);

                    if (entry) {
                        entry.callbacks.forEach(cb => cb(navSatMessage));
                    }
                }, 3000);

                topicListener.gpsSimulationInterval = gpsInterval;
            }

            // Store info
            this.activeTopics.set(topicName, {
                listener: topicListener,
                count: 0,
                callbacks: new Set()
            });
        }

        // Add callback and increment count
        const entry = this.activeTopics.get(topicName);
        entry.count++;
        entry.callbacks.add(callback);
    }

    unsubscribe(topicName, callback){
        if (this.activeTopics.has(topicName)){
            const entry = this.activeTopics.get(topicName);
            entry.callbacks.delete(callback);
            entry.count--;

            if (entry.count <= 0){
                // Clean up
                if (entry.listener.gpsSimulationInterval){
                    clearInterval(entry.listener.gpsSimulationInterval);
                    console.log('Stopped GPS simulation');
                }

                entry.listener.unsubscribe();
                this.activeTopics.delete(topicName);
                console.log(`No more listeners for ${topicName}, unsubscribed.`);
            }
        }
    }

    startGpsTest(){
        console.log('Starting manual GPS test');
        return this.subscribe('/rover/gps', 'sensor_msgs/NavSatFix', (msg) => {
            console.log('Received GPS test data: ', msg);
        });
    }

    stopAllSimulations(){
        this.activeTopics.forEach((entry, topicName) => {
            if (entry.listener.gpsSimulationInterval){
                clearInterval(entry.listener.gpsSimulationInterval);
                console.log(`Stopped simulation for ${topicName}`);
            }
        });
    }
}

export const testrosServiceInstance = new RosService();