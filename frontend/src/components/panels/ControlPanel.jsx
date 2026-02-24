import React, { useEffect, useRef, useState } from 'react';
import { Ros, Topic } from 'roslib';
import TabButton from '../TabButton';
import { useRosTopic } from '../../useRosTopic';
import { connectionStatus } from '../../useRosTopic';

/* ===================== UI COMPONENTS ===================== */
const Metric = ({ label, value, percent, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span>{label}</span>
      <span className={`text-${color}-400 font-bold`}>{value}</span>
    </div>
    <div className="w-full bg-slate-800 h-2 rounded">
      <div
        className={`bg-${color}-400 h-2 rounded`}
        style={{ width: `${percent}%` }}
      />
    </div>
  </div>
);

const DataBox = ({ label, value, connected }) => (
  <div className="bg-slate-800 p-2 rounded flex justify-between items-center">
    <div>
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-green-400 font-bold">{value}</div>
    </div>
  </div>
);

/* ===================== COMPASS ===================== */
const Compass = ({ degrees }) => (
  <div className="flex flex-col items-center justify-center min-h-[220px]">
    <div className="relative w-40 h-40 rounded-full border-2 border-slate-500 bg-slate-800/50 shadow-inner flex items-center justify-center">

      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-full h-full"
          style={{ transform: `rotate(${i * 30}deg)` }}
        >
          <div className="w-0.5 h-2 bg-slate-500 mx-auto"></div>
        </div>
      ))}

      <span className="absolute top-2 text-sm text-red-500 font-extrabold">N</span>
      <span className="absolute right-2 text-xs text-slate-400 font-bold">E</span>
      <span className="absolute bottom-2 text-xs text-slate-400 font-bold">S</span>
      <span className="absolute left-2 text-xs text-slate-400 font-bold">W</span>

      <div
        className="absolute w-1.5 h-32 transition-transform duration-500 ease-out flex flex-col justify-between items-center"
        style={{ transform: `rotate(${degrees?.toFixed(1) || 0}deg)` }}
      >
        <div className="w-full h-[45%] bg-red-600 rounded-t-full" />
        <div className="w-full h-[45%] bg-slate-300 rounded-b-full" />
      </div>

      <div className="absolute w-4 h-4 bg-slate-900 rounded-full border border-slate-500 z-10 shadow-lg" />
    </div>

    <div className="mt-4 text-green-400 text-2xl font-bold">
      {degrees?.toFixed(1) || 0}°
    </div>
  </div>
);

/* ===================== MAIN COMPONENT ===================== */
const ControlPanel = ({ onAction }) => {

  const [rosConnected, setRosConnected] = useState(false);
  
  const [activeControlTab, setActiveControlTab] = useState('Launch');
  const [activeLaunchButton, setActiveLaunchButton] = useState(null);
  
  /* ---------- ROS DATA ---------- */
  const battery = useRosTopic('/voltage', 'std_msgs/Float32');
  const ampere = useRosTopic('/ampere', 'std_msgs/Float32');
  const x = useRosTopic('/xcoordinates', 'std_msgs/Float32');
  const y = useRosTopic('/ycoordinates', 'std_msgs/Float32');
  const velX = useRosTopic('/xvelocity', 'std_msgs/Float32');
  const velY = useRosTopic('/yvelocity', 'std_msgs/Float32');
  const accel = useRosTopic('/acceleration', 'std_msgs/Float32');
  const distance = useRosTopic('/distance', 'std_msgs/Float32');
  const compass = useRosTopic('/compass_data_topic', 'std_msgs/Float64');
  
    useEffect(() => {
      const interval = setInterval(() => {
        setRosConnected(connectionStatus());
      }, 1000);
      
      return () => clearInterval(interval);
    }, []);
  
  /* ---------- LAUNCH BUTTON ---------- */
  const LaunchButton = ({ terminal = 1, command, children }) => (
    <button
      onClick={() => {
        onAction(`Terminal ${terminal}`, command);
        setActiveLaunchButton(activeLaunchButton === command ? null : command);
      }}
      className={`w-full py-2 font-bold rounded text-white ${
        activeLaunchButton === command
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-gray-600 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-slate-900 border border-slate-700 h-full">

      {/* HEADER */}
      <div className="bg-slate-800 border-b border-slate-700 flex justify-between px-2">
        <div className="flex">
          {['Launch', 'Data'].map(tab => (
            <TabButton
              key={tab}
              active={activeControlTab === tab}
              onClick={() => setActiveControlTab(tab)}
              className="flex-1 text-center"
            >
              {tab}
            </TabButton>
          ))}
        </div>
        <div className="text-xs flex items-center">
          {rosConnected
            ? <span className="text-green-400">ROS Connected</span>
            : <span className="text-red-400">Disconnected</span>
          }
        </div>
      </div>

      {/* BODY */}
      <div className="p-3 space-y-3">
        {activeControlTab === 'Launch' && (
          <>
            <LaunchButton command="echo Base Station Manual">Base Station Manual</LaunchButton>
            <LaunchButton command="ls" terminal={2}>Rover Manual</LaunchButton>
            <LaunchButton command="Autonomous Mode">Autonomous Mode</LaunchButton>
            <LaunchButton command="Science Base">Science Base</LaunchButton>
            <LaunchButton command="Science Rover" terminal={2}>Science Rover</LaunchButton>

            <button
              className="w-full bg-red-600 text-white py-1 text-xs rounded"
              onClick={() => setActiveLaunchButton(null)}
            >
              EMERGENCY STOP
            </button>
          </>
        )}

       {activeControlTab === 'Data' && (
        <>
            {/* ================= POSITION ================= */}
            <div className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-1">
              Current Position
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <DataBox label="X" value={`${x?.data?.toFixed(2) || 0} m`} />
              <DataBox label="Y" value={`${y?.data?.toFixed(2) || 0} m`} />
            </div>

            {/* ================= MOTION ================= */}
            <div className="text-xs uppercase tracking-widest text-blue-500 font-bold mb-1">
              Current Motion
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <DataBox label="VEL X" value={`${velX?.data?.toFixed(2) || 0} m/s`} />
              <DataBox label="VEL Y" value={`${velY?.data?.toFixed(2) || 0} m/s`} />
            </div>

            {/* ================= DYNAMICS ================= */}
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-1">
              Navigation Dynamics
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <DataBox label="DIST" value={`${distance?.data?.toFixed(2) || 0} m`} />
              <DataBox label="ACC" value={`${accel?.data?.toFixed(2) || 0} m/s²`} />
            </div>

            {/* ================= POWER ================= */}
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-2">
              Power Status
            </div>

            <div className="space-y-2 mb-6">
              <Metric
                label="AMPERE"
                value={`${ampere?.data?.toFixed(1) || 0} A`}
                percent={Math.min((ampere?.data || 0) * 10, 100)}
                color="green"
              />
              <Metric
                label="BATTERY"
                value={`${battery?.data?.toFixed(1) || 0} V`}
                percent={Math.min((battery?.data || 0) * 10, 100)}
                color="yellow"
              />
            </div>

            {/* ================= HEADING ================= */}
            <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold mb-2 text-center">
              Compass
            </div>

            <div className="flex justify-center">
              <Compass degrees={compass?.data} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;