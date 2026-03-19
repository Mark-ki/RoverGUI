import React, { useEffect, useState, useRef } from 'react';
import CameraStream from '../CameraOpenCV';
import TabButton from '../TabButton';
import RosImagePanel from './RosImagePanel';

function CameraPanelCV() {
  const [streams, setStreams] = useState({}); // Stores active ports
  const [activeCameraTab, setActiveCameraTab] = useState('CAM1');
  const wsRef = useRef(null);
  const streamRefsRef = useRef({});
  const [cameras, setCameras] = useState(["CAM1", "CAM2", "CAM3"]);

  // Map tabs to port indices (adjust ports based on your backend)
  const portList = Object.keys(streams).sort(); 
  const getPortByCam = (camName) => {
    const index = parseInt(camName.replace('CAM', '')) - 1;
    return portList[index];
  };

  const addCameraTab = () => {
    if(cameras.length >= 8) return; // Limit to 6 cameras
    const newCamNumber = cameras.length + 1;
    setCameras([...cameras, `CAM${newCamNumber}`]);
  };

  const removeCameraTab = () => {
    
    if (cameras.length > 2) {
      setCameras(cameras.slice(0, -1));
    }
  };


  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { port, frame } = data;

        setStreams((prev) => {
          if (!prev[port]) return { ...prev, [port]: true };
          return prev;
        });

        const streamRef = streamRefsRef.current[port];
        if (streamRef?.drawFrame) {
          streamRef.drawFrame(frame);
        }
      } catch (err) {
        console.error('Error processing frame:', err);
      }
    };

    return () => ws.close();
  }, []);

  // Helper to render a stream into a styled container
  const RenderStream = ({ port, label, className = "" }) => (
    <div className={`bg-black border border-slate-600 relative overflow-hidden ${className}`}>
      {port ? (
        <CameraStream
          port={parseInt(port)}
          ref={(el) => {
            if (el) streamRefsRef.current[port] = el;
            else delete streamRefsRef.current[port];
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-700 text-xs">
          NO SIGNAL
        </div>
      )}
      <div className="absolute top-1 right-1 text-[10px] font-bold text-green-400 bg-black/40 px-1 rounded">
        ● {label}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-700 h-full flex flex-col font-sans text-slate-200">
      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 text-[10px] font-bold tracking-widest">
        <div className="grid grid-cols-5">
          {cameras.map((tab) => (
            <TabButton
              key={tab}
              active={activeCameraTab === tab}
              onClick={() => setActiveCameraTab(tab)}
            >
              {tab}
            </TabButton>
          ))}

          <TabButton
            key="FULL"
            active={activeCameraTab === "FULL"}
            onClick={() => setActiveCameraTab("FULL")}
          >
            Full
          </TabButton>

          <div>

          <TabButton
            key="MINUS"
            onClick={() => removeCameraTab()}
          >
            -
          </TabButton>

          <TabButton
            key="PLUS"
            onClick={() => addCameraTab()}
          >
            +
          </TabButton>
          </div>
        </div>
      </div>

      {/* Main video display */}
      <div className="p-2 flex-1 flex flex-col min-h-0">
        <div className="flex-1 mb-2">
          {activeCameraTab !== "FULL" ? (
            <div className="grid grid-rows-[1fr,auto] gap-1 h-full">
              {/* Primary Focus Camera */}
              <RenderStream 
                port={getPortByCam(activeCameraTab)} 
                label={activeCameraTab} 
                className="aspect-video"
              />

              {/* Secondary Bottom Row (The other two cameras) */}
              <div className="grid grid-cols-2 gap-1">
                {cameras
                  .filter((cam) => cam !== activeCameraTab)
                  .map((cam) => (
                    <RenderStream 
                      key={cam} 
                      port={getPortByCam(cam)} 
                      label={cam} 
                      className="aspect-video" 
                    />
                  ))}
              </div>
            </div>
          ) : (
            /* Fullscreen Grid Layout */
            <div className="grid grid-cols-3 gap-1 w-full relative">
              {/* <div className="flex flex-col gap-1 col-span-1">
                <RenderStream port={portList[0]} label="CAM1" className="flex-1" />
                <RenderStream port={portList[1]} label="CAM2" className="flex-1" />
              </div>
              <RenderStream port={portList[2]} label="CAM3" className="col-span-2 aspect-video" />

              map */}
              {cameras.map((cam) => (
                <RenderStream 
                  key={cam}
                  port={getPortByCam(cam)}
                  label={cam}
                  className="aspect-video"
                />
              ))}

              <RosImagePanel topicName={"/bottle"}></RosImagePanel>
              <RosImagePanel topicName={"/panorama"}></RosImagePanel>

            </div>
          )}
        </div>

        {/* Camera status info */}
        <div className="space-y-1 text-[10px] uppercase tracking-tighter border-t border-slate-800 pt-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Exposure:</span>
            <span className="text-green-400 font-mono">Auto</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Focus:</span>
            <span className="text-green-400 font-mono">Inf [∞]</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Network:</span>
            <span className={`${Object.keys(streams).length > 0 ? 'text-green-400' : 'text-red-500'} font-mono`}>
              {Object.keys(streams).length > 0 ? 'Connected' : 'Searching...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraPanelCV;