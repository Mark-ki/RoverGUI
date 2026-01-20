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
import React, { useEffect, useRef, useState } from 'react';
import { Ros, Topic } from 'roslib';

// --- UTILS ---
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

// --- SUB-COMPONENTS ---

/**
 * Compass: High-fidelity circular gauge with a central pivot.
 */
const Compass = ({ degrees }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[220px]">
    <div className="relative w-40 h-40 rounded-full border-2 border-slate-500 bg-slate-800/50 shadow-inner flex items-center justify-center">
      {/* Degree Ticks */}
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
          <div className="w-0.5 h-2 bg-slate-500 mx-auto"></div>
        </div>
      ))}
      
      {/* Cardinal Points */}
      <span className="absolute top-2 text-sm text-red-500 font-extrabold">N</span>
      <span className="absolute right-2 text-xs text-slate-400 font-bold">E</span>
      <span className="absolute bottom-2 text-xs text-slate-400 font-bold">S</span>
      <span className="absolute left-2 text-xs text-slate-400 font-bold">W</span>

      {/* Rotating Tapered Needle */}
      <div 
        className="absolute w-1.5 h-32 transition-transform duration-500 ease-out flex flex-col justify-between items-center"
        style={{ transform: `rotate(${degrees}deg)` }}
      >
        <div className="w-full h-[45%] bg-red-600 rounded-t-full shadow-sm" />
        <div className="w-full h-[45%] bg-slate-300 rounded-b-full shadow-sm" />
      </div>
      
      {/* Center Cap */}
      <div className="absolute w-4 h-4 bg-slate-900 rounded-full border border-slate-500 z-10 shadow-lg"></div>
    </div>
    <div className="mt-4 text-green-400 text-3xl font-bold tracking-tight">{degrees.toFixed(1)}°</div>
  </div>
);

/**
 * DataBox: Standardized filled container for coordinates and sensor values.
 */
const DataBox = ({ label, value }) => (
  <div className="bg-slate-700 p-3 rounded border border-slate-600/50 shadow-sm flex flex-col justify-center min-h-[60px]">
    <div className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">{label}</div>
    <div className="text-green-400 font-bold text-xl truncate font-mono">{value}</div>
  </div>
);

const Metric = ({ label, value, percent, color }) => {
  const colors = {
    green: 'bg-green-400 text-green-400',
    yellow: 'bg-yellow-400 text-yellow-400',
    red: 'bg-red-400 text-red-400'
  };
  const activeColor = colors[color] || colors.green;
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-white">
        <span className="font-bold">{label}</span>
        <span className={activeColor.split(' ')[1]}>{value}</span>
      </div>
      <div className="w-full bg-slate-700 h-2 rounded-full">
        <div 
          className={`${activeColor.split(' ')[0]} h-2 rounded-full transition-all duration-700`} 
          style={{ width: `${Math.min(percent, 100)}%` }} 
        />
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const ControlPanel = () => {
  const rosRef = useRef(null);
  const reconnectRef = useRef(null);

  const [rosConnected, setRosConnected] = useState(false);
  const [rosConnecting, setRosConnecting] = useState(false);

  // States
  const [battery, setBattery] = useState(0);
  const [ampere, setAmpere] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [velX, setVelX] = useState(0);
  const [velY, setVelY] = useState(0);
  const [accel, setAccel] = useState(0);
  const [distance, setDistance] = useState(0);
  const [compass, setCompass] = useState(0);

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
        setRosConnected(true);
        setRosConnecting(false);
        if (reconnectRef.current) clearInterval(reconnectRef.current);
      };

      const onError = () => {
        if (!mounted) return;
        setRosConnected(false);
        setRosConnecting(false);
      };

      const onClose = () => {
        if (!mounted) return;
        setRosConnected(false);
        setRosConnecting(false);
        startReconnect(url);
      };

      function startReconnect(wsUrl) {
        if (reconnectRef.current) return;
        reconnectRef.current = setInterval(() => {
          try {
            const newRos = new Ros({ url: wsUrl });
            rosRef.current = newRos;
            newRos.on('connection', onConnection);
            newRos.on('error', onError);
            newRos.on('close', onClose);
          } catch (e) { console.error(e); }
        }, 2000);
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

  const emergencyStop = () => {
    if (!rosRef.current || !rosConnected) return;
    const cmdVel = new Topic({ ros: rosRef.current, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
    cmdVel.publish({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });
  };

  return (
    <div className="bg-slate-900 border border-slate-700 h-full p-4 grid grid-rows-[auto_1fr_auto] gap-4 font-sans text-slate-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-700">
        <h3 className="text-xl text-white font-black uppercase tracking-tighter">Robot Control Panel</h3>
        <div className="text-xs">
          {rosConnected ? (
            <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 font-bold">● ROS Connected</span>
          ) : rosConnecting ? (
            <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 font-bold animate-pulse">○ Connecting...</span>
          ) : (
            <span className="bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 font-bold">○ Disconnected</span>
          )}
        </div>
      </div>

      {/* CENTER SECTION */}
      <div className="grid grid-cols-2 gap-4 h-full overflow-hidden">
        
        {/* LEFT: Power Panel */}
        <div className="bg-slate-800 p-4 border border-slate-700 flex flex-col justify-between rounded shadow-xl">
          <h4 className="text-[10px] text-slate-400 font-black uppercase mb-4 tracking-widest border-l-2 border-slate-500 pl-2">Power Management</h4>
          <div className="space-y-6">
            <Metric label="BATTERY" value={`${battery.toFixed(1)}V`} percent={Math.min(battery * 8, 100)} color="yellow" />
            <Metric label="LOAD" value={`${ampere.toFixed(1)}A`} percent={Math.min(ampere * 20, 100)} color="green" />
          </div>
          <button onClick={emergencyStop} className="w-full bg-red-600 text-white py-3 mt-6 hover:bg-red-500 font-black rounded shadow-lg uppercase text-sm tracking-widest transition-all active:scale-95">
            Emergency Stop
          </button>
        </div>

        {/* RIGHT: High-Fidelity Diagnostic Panel */}
        <div className="bg-slate-800 p-4 border border-slate-700 rounded-lg flex flex-col h-full shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
            <h4 className="text-[10px] text-white font-black uppercase tracking-widest">Sensor Data</h4>
            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest pr-10">Heading</h4>
          </div>

          <div className="grid grid-cols-2 gap-6 flex-grow items-start">
            {/* Sensor Column with Gaps */}
            <div className="flex flex-col gap-6"> 
              <div className="grid grid-cols-2 gap-2">
                <DataBox label="Coord X" value={x.toFixed(2)} />
                <DataBox label="Coord Y" value={y.toFixed(2)} />
              </div>
              <div className="flex flex-col gap-4"> 
                <DataBox label="Distance" value={`${distance.toFixed(1)}m`} />
                <DataBox label="Acceleration" value={accel.toFixed(1)} />
                <DataBox label="Temperature" value="35.2°C" />
              </div>
            </div>

            {/* Compass Section */}
            <div className="border-l border-slate-700 h-full flex items-center justify-center pl-6">
              <Compass degrees={compass} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="bg-slate-800 p-4 border border-slate-700 rounded shadow-lg">
        <h4 className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-widest">Kinematics Engine</h4>
        <div className="grid grid-cols-4 gap-2">
          <DataBox label="Velocity X" value={`${velX.toFixed(2)} m/s`} />
          <DataBox label="Velocity Y" value={`${velY.toFixed(2)} m/s`} />
          <DataBox label="Motor Temp A" value="24.1°C" /> 
          <DataBox label="Motor Temp B" value="25.5°C" /> 
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;