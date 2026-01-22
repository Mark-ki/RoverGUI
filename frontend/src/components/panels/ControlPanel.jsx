// import React, { useEffect, useRef, useState } from 'react';
// import { Ros, Topic } from 'roslib'; // updated import, no default
// import TabButton from '../TabButton';

// // Fetch host IP
// async function getHostIP() {
//   try {
//     const resp = await fetch('/get-ip');
//     if (!resp.ok) throw new Error('IP fetch failed');
//     const data = await resp.json();
//     return data.ip;
//   } catch (err) {
//     console.warn('Falling back to localhost:', err);
//     return 'localhost';
//   }
// }

// const ControlPanel = () => {
//   const rosRef = useRef(null);
//   const reconnectRef = useRef(null);

//   const [rosConnected, setRosConnected] = useState(false);
//   const [rosConnecting, setRosConnecting] = useState(false);

//   // Sensor states
//   const [battery, setBattery] = useState(0);
//   const [ampere, setAmpere] = useState(0);
//   const [x, setX] = useState(0);
//   const [y, setY] = useState(0);
//   const [velX, setVelX] = useState(0);
//   const [velY, setVelY] = useState(0);
//   const [accel, setAccel] = useState(0);
//   const [distance, setDistance] = useState(0);
//   const [compass, setCompass] = useState(0);

//   const [activeControlTab, setActiveControlTab] = useState('Launch');

//   // ---------------- CREATE ROS CONNECTION ----------------
//   useEffect(() => {
//     let mounted = true;
//     async function connectROS() {
//       setRosConnecting(true);
//       const ip = await getHostIP();
//       const url = `ws://${ip}:9090`;

//       const ros = new Ros({ url });
//       rosRef.current = ros;

//       const onConnection = () => {
//         if (!mounted) return;
//         console.log('ROS connected');
//         setRosConnected(true);
//         setRosConnecting(false);

//         if (reconnectRef.current) {
//           clearInterval(reconnectRef.current);
//           reconnectRef.current = null;
//         }
//       };

//       const onError = (err) => {
//         if (!mounted) return;
//         console.error('ROS error:', err);
//         setRosConnected(false);
//         setRosConnecting(false);
//       };

//       const onClose = () => {
//         if (!mounted) return;
//         console.warn('ROS closed');
//         setRosConnected(false);
//         setRosConnecting(false);
//         startReconnect(url);
//       };

//       ros.on('connection', onConnection);
//       ros.on('error', onError);
//       ros.on('close', onClose);

//       function startReconnect(wsUrl) {
//         if (reconnectRef.current) return;
//         reconnectRef.current = setInterval(() => {
//           console.log('Reconnecting to ROS...');
//           try {
//             const newRos = new Ros({ url: wsUrl });
//             rosRef.current = newRos;
//             newRos.on('connection', onConnection);
//             newRos.on('error', onError);
//             newRos.on('close', onClose);
//           } catch (e) {
//             console.error('Reconnect failed', e);
//           }
//         }, 1000);
//       }
//     }

//     connectROS();

//     return () => {
//       mounted = false;
//       if (reconnectRef.current) clearInterval(reconnectRef.current);
//       if (rosRef.current) rosRef.current.close();
//     };
//   }, []);

//   // ---------------- ROS SUBSCRIPTIONS ----------------
//   useEffect(() => {
//     if (!rosRef.current || !rosConnected) return;

//     const topics = {
//       battery: new Topic({ ros: rosRef.current, name: '/voltage', messageType: 'std_msgs/Float32' }),
//       ampere: new Topic({ ros: rosRef.current, name: '/ampere', messageType: 'std_msgs/Float32' }),
//       x: new Topic({ ros: rosRef.current, name: '/xcoordinates', messageType: 'std_msgs/Float32' }),
//       y: new Topic({ ros: rosRef.current, name: '/ycoordinates', messageType: 'std_msgs/Float32' }),
//       velX: new Topic({ ros: rosRef.current, name: '/xvelocity', messageType: 'std_msgs/Float32' }),
//       velY: new Topic({ ros: rosRef.current, name: '/yvelocity', messageType: 'std_msgs/Float32' }),
//       accel: new Topic({ ros: rosRef.current, name: '/acceleration', messageType: 'std_msgs/Float32' }),
//       distance: new Topic({ ros: rosRef.current, name: '/distance', messageType: 'std_msgs/Float32' }),
//       compass: new Topic({ ros: rosRef.current, name: '/compass_data_topic', messageType: 'std_msgs/Float64' })
//     };

//     topics.battery.subscribe(msg => setBattery(msg.data));
//     topics.ampere.subscribe(msg => setAmpere(msg.data));
//     topics.x.subscribe(msg => setX(msg.data));
//     topics.y.subscribe(msg => setY(msg.data));
//     topics.velX.subscribe(msg => setVelX(msg.data));
//     topics.velY.subscribe(msg => setVelY(msg.data));
//     topics.accel.subscribe(msg => setAccel(msg.data));
//     topics.distance.subscribe(msg => setDistance(msg.data));
//     topics.compass.subscribe(msg => setCompass(msg.data));

//     return () => Object.values(topics).forEach(t => t.unsubscribe());
//   }, [rosConnected]);

//   // ---------------- EMERGENCY STOP ----------------
//   const emergencyStop = () => {
//     if (!rosRef.current || !rosConnected) return;
//     const cmdVel = new Topic({ ros: rosRef.current, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
//     cmdVel.publish({
//       linear: { x: 0, y: 0, z: 0 },
//       angular: { x: 0, y: 0, z: 0 }
//     });
//     console.log('EMERGENCY STOP SENT');
//   };

//   // ---------------- UI ----------------
//   return (
//     <div className="bg-slate-900 border border-slate-700 h-full">
//       <div className="bg-slate-800 border-b border-slate-700 flex justify-between px-2">
//         <div className="flex">
//           {['Launch', 'Data', 'Motor'].map(tab => (
//             <TabButton
//               key={tab}
//               active={activeControlTab === tab}
//               onClick={() => setActiveControlTab(tab)}
//               className="flex-1 text-center"
//             >
//               {tab}
//             </TabButton>
//           ))}
//         </div>
//         <div className="text-xs flex items-center">
//           {rosConnected ?
//             <span className="text-green-400">ROS Connected</span> :
//             rosConnecting ?
//               <span className="text-yellow-400">Connecting...</span> :
//               <span className="text-red-400">Disconnected</span>
//           }
//         </div>
//       </div>

//       <div className="p-3 space-y-3">
//         {activeControlTab === 'Launch' && (
//           <>
//             <Metric label="AMPERE" value={`${ampere.toFixed(1)} A`} percent={Math.min(ampere * 10, 100)} color="green" />
//             <Metric label="BATTERY" value={`${battery.toFixed(1)} V`} percent={Math.min(battery * 10, 100)} color="yellow" />

//             <button
//               onClick={emergencyStop}
//               className="w-full bg-red-600 text-white py-1 text-xs hover:bg-red-700"
//             >
//               EMERGENCY STOP
//             </button>
//           </>
//         )}

//         {activeControlTab === 'Data' && (
//           <div className="grid grid-cols-2 gap-2 text-xs">
//             <DataBox label="COORD X" value={x.toFixed(2)} />
//             <DataBox label="COORD Y" value={y.toFixed(2)} />
//             <DataBox label="DIST" value={`${distance.toFixed(2)} m`} />
//             <DataBox label="VEL X" value={`${velX.toFixed(2)} m/s`} />
//             <DataBox label="VEL Y" value={`${velY.toFixed(2)} m/s`} />
//             <DataBox label="ACC" value={`${accel.toFixed(2)} m/s²`} />
//             <DataBox label="Compass" value={`${compass.toFixed(1)}°`} />
//           </div>
//         )}

//         {activeControlTab === 'Motor' && (
//           <div className="grid grid-cols-2 gap-2 text-xs">
//             <DataBox label="VEL X" value={`${velX.toFixed(2)} m/s`} />
//             <DataBox label="VEL Y" value={`${velY.toFixed(2)} m/s`} />
//             <div className="bg-slate-800 p-2 col-span-2">
//               <div className="text-slate-400">ACCEL</div>
//               <div className="text-cyan-400 font-bold">{accel.toFixed(2)} m/s²</div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // --------- SMALL UI COMPONENTS ----------
// const Metric = ({ label, value, percent, color }) => (
//   <div>
//     <div className="flex justify-between text-xs mb-1">
//       <span>{label}</span>
//       <span className={`text-${color}-400`}>{value}</span>
//     </div>
//     <div className="w-full bg-slate-800 h-2 rounded">
//       <div className={`bg-${color}-400 h-2 rounded`} style={{ width: `${percent}%` }} />
//     </div>
//   </div>
// );

// const DataBox = ({ label, value }) => (
//   <div className="bg-slate-800 p-2">
//     <div className="text-slate-400">{label}</div>
//     <div className="text-green-400 font-bold">{value}</div>
//   </div>
// );

// export default ControlPanel;

import React, { useEffect, useRef, useState } from 'react';
import { Ros, Topic } from 'roslib';

// Fetch host IP
async function getHostIP() {
  try {
    const resp = await fetch('/get-ip');
    if (!resp.ok) throw new Error('IP fetch failed');
    const data = await resp.json();
    return data.ip;
  } catch (err) {
    console.warn('Falling back to localhost:', err);
    return 'localhost';
  }
}

const ControlPanel = () => {
  const rosRef = useRef(null);
  const reconnectRef = useRef(null);

  const [rosConnected, setRosConnected] = useState(false);
  const [rosConnecting, setRosConnecting] = useState(false);

  // Sensor states
  const [battery, setBattery] = useState(0);
  const [ampere, setAmpere] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [velX, setVelX] = useState(0);
  const [velY, setVelY] = useState(0);
  const [accel, setAccel] = useState(0);
  const [distance, setDistance] = useState(0);
  const [compass, setCompass] = useState(0);

  // ---------------- CREATE ROS CONNECTION ----------------
  useEffect(() => {
    let mounted = true;

    async function connectROS() {
      setRosConnecting(true);
      const ip = await getHostIP();
      const url = `ws://${ip}:9090`;

      const ros = new Ros({ url });
      rosRef.current = ros;

      const onConnection = () => {
        if (!mounted) return;
        console.log('ROS connected');
        setRosConnected(true);
        setRosConnecting(false);
        if (reconnectRef.current) clearInterval(reconnectRef.current);
      };

      const onError = (err) => {
        if (!mounted) return;
        console.error('ROS error:', err);
        setRosConnected(false);
        setRosConnecting(false);
      };

      const onClose = () => {
        if (!mounted) return;
        console.warn('ROS closed');
        setRosConnected(false);
        setRosConnecting(false);
        startReconnect(url);
      };

      function startReconnect(wsUrl) {
        if (reconnectRef.current) return;
        reconnectRef.current = setInterval(() => {
          console.log('Reconnecting to ROS...');
          try {
            const newRos = new Ros({ url: wsUrl });
            rosRef.current = newRos;
            newRos.on('connection', onConnection);
            newRos.on('error', onError);
            newRos.on('close', onClose);
          } catch (e) {
            console.error('Reconnect failed', e);
          }
        }, 1000);
      }

      ros.on('connection', onConnection);
      ros.on('error', onError);
      ros.on('close', onClose);
    }

    connectROS();

    return () => {
      mounted = false;
      if (reconnectRef.current) clearInterval(reconnectRef.current);
      if (rosRef.current) rosRef.current.close();
    };
  }, []);

  // ---------------- ROS SUBSCRIPTIONS ----------------
  useEffect(() => {
    if (!rosRef.current || !rosConnected) return;

    const topics = {
      battery: new Topic({ ros: rosRef.current, name: '/voltage', messageType: 'std_msgs/Float32' }),
      ampere: new Topic({ ros: rosRef.current, name: '/ampere', messageType: 'std_msgs/Float32' }),
      x: new Topic({ ros: rosRef.current, name: '/xcoordinates', messageType: 'std_msgs/Float32' }),
      y: new Topic({ ros: rosRef.current, name: '/ycoordinates', messageType: 'std_msgs/Float32' }),
      velX: new Topic({ ros: rosRef.current, name: '/xvelocity', messageType: 'std_msgs/Float32' }),
      velY: new Topic({ ros: rosRef.current, name: '/yvelocity', messageType: 'std_msgs/Float32' }),
      accel: new Topic({ ros: rosRef.current, name: '/acceleration', messageType: 'std_msgs/Float32' }),
      distance: new Topic({ ros: rosRef.current, name: '/distance', messageType: 'std_msgs/Float32' }),
      compass: new Topic({ ros: rosRef.current, name: '/compass_data_topic', messageType: 'std_msgs/Float64' }),
    };

    topics.battery.subscribe(msg => setBattery(msg.data));
    topics.ampere.subscribe(msg => setAmpere(msg.data));
    topics.x.subscribe(msg => setX(msg.data));
    topics.y.subscribe(msg => setY(msg.data));
    topics.velX.subscribe(msg => setVelX(msg.data));
    topics.velY.subscribe(msg => setVelY(msg.data));
    topics.accel.subscribe(msg => setAccel(msg.data));
    topics.distance.subscribe(msg => setDistance(msg.data));
    topics.compass.subscribe(msg => setCompass(msg.data));

    return () => Object.values(topics).forEach(t => t.unsubscribe());
  }, [rosConnected]);

  // ---------------- EMERGENCY STOP ----------------
  const emergencyStop = () => {
    if (!rosRef.current || !rosConnected) return;
    const cmdVel = new Topic({ ros: rosRef.current, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
    cmdVel.publish({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });
    console.log('EMERGENCY STOP SENT');
  };

  // ---------------- UI ----------------
  return (
    <div className="bg-slate-900 border border-slate-700 h-full p-3 grid grid-rows-[auto_1fr_auto] gap-3">
      
      {/* HEADER */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-700">
        <h3 className="text-lg text-white font-bold">Robot Control Panel</h3>
        <div className="text-xs flex items-center">
          {rosConnected ?
            <span className="text-green-400 font-bold">ROS Connected</span> :
            rosConnecting ?
              <span className="text-yellow-400 font-bold">Connecting...</span> :
              <span className="text-red-400 font-bold">Disconnected</span>
          }
        </div>
      </div>

      {/* TOP SECTION: Launch & Data */}
      <div className="grid grid-cols-2 gap-3 h-full overflow-y-auto">

        {/* LEFT: Launch & Power Control */}
        <div className="bg-slate-800 p-3 border border-slate-700 flex flex-col justify-between">
          <h4 className="text-base text-white font-semibold mb-3 border-b border-slate-600 pb-1">Launch & Power</h4>
          <div className="space-y-4">
            <Metric label="BATTERY" value={`${battery.toFixed(1)} V`} percent={Math.min(battery * 20, 100)} color="yellow" />
            <Metric label="AMPERE" value={`${ampere.toFixed(1)} A`} percent={Math.min(ampere * 20, 100)} color="green" />
          </div>
          <button
            onClick={emergencyStop}
            className="w-full bg-red-600 text-white py-2 text-md mt-4 hover:bg-red-700 font-bold transition-colors">
            EMERGENCY STOP
          </button>
        </div>

        {/* RIGHT: Data Diagnostics */}
        <div className="bg-slate-800 p-3 border border-slate-700 flex flex-col overflow-y-auto">
          <h4 className="text-base text-white font-semibold mb-3 border-b border-slate-600 pb-1">Sensor Data</h4>
          <div className="grid grid-cols-2 gap-2 text-xs flex-grow min-h-[180px]">
            <DataBox label="COORD X" value={x.toFixed(2)} />
            <DataBox label="COORD Y" value={y.toFixed(2)} />
            <DataBox label="DIST" value={`${distance.toFixed(2)} m`} />
            <DataBox label="Compass" value={`${compass.toFixed(1)}°`} />
            <DataBox label="ACCEL" value={`${accel.toFixed(2)} m/s²`} />
            <DataBox label="TEMP (System)" value={`35.2 °C`} />
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Motor / Kinematics */}
      <div className="bg-slate-800 p-3 border border-slate-700 flex-shrink-0">
        <h4 className="text-base text-white font-semibold mb-2 border-b border-slate-600 pb-1">Motor & Kinematics</h4>
        <div className="grid grid-cols-4 gap-3 text-xs">
          <DataBox label="VEL X" value={`${velX.toFixed(2)} m/s`} />
          <DataBox label="VEL Y" value={`${velY.toFixed(2)} m/s`} />
          <DataBox label="Motor Temp (A)" value={`24.1 °C`} /> 
          <DataBox label="Motor Temp (B)" value={`25.5 °C`} /> 
        </div>
      </div>
    </div>
  );
};

// --------- SMALL UI COMPONENTS ----------
// const Metric = ({ label, value, percent, color }) => (
//   <div>
//     <div className="flex justify-between text-xs mb-1">
//       <span>{label}</span>
//       <span className={`text-${color}-400`}>{value}</span>
//     </div>
//     <div className="w-full bg-slate-800 h-2 rounded">
//       <div className={`bg-${color}-400 h-2 rounded`} style={{ width: `${percent}%` }} />
//     </div>
//   </div>
// );

// const DataBox = ({ label, value }) => (
//   <div className="bg-slate-800 p-2">
//     <div className="text-slate-400">{label}</div>
//     <div className="text-green-400 font-bold">{value}</div>
//   </div>
// );

// export default ControlPanel;

const colorMap = {
  green: 'bg-green-400 text-green-400',
  yellow: 'bg-yellow-400 text-yellow-400',
  red: 'bg-red-400 text-red-400',
  cyan: 'bg-cyan-400 text-cyan-400',
};

const Metric = ({ label, value, percent, color }) => {
  const bgColor = colorMap[color] || 'bg-green-400 text-green-400';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className={bgColor.split(' ')[1]}>{value}</span>
      </div>
      <div className="w-full bg-slate-700 h-2 rounded">
        <div className={bgColor.split(' ')[0] + ' h-2 rounded'} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const DataBox = ({ label, value }) => (
  <div className="bg-slate-700 p-2 rounded">
    <div className="text-slate-400 text-xs">{label}</div>
    <div className="text-green-400 font-bold">{value}</div>
  </div>
);

export default ControlPanel;