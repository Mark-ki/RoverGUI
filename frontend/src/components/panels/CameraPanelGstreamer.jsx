/* global GstWebRTCAPI */
import React, { useEffect, useState, useRef } from 'react';
import CameraStream from '../CameraOpenCV'; // Updated import
import TabButton from '../TabButton';
import RosImagePanel from './RosImagePanel';

function CameraPanel() {
  const [activeCameraTab, setActiveCameraTab] = useState('CAM1');
  const [cameras, setCameras] = useState(["CAM1", "CAM2", "CAM3"]);
  const [flippedCameras, setFlippedCameras] = useState({});
  
  // WebRTC State mappings
  const [producers, setProducers] = useState([]); // Array of { id, name, stream }
  const activeSessionsRef = useRef({}); // Tracks active WebRTC connections

  const toggleFlip = (camId) => {
    setFlippedCameras((prev) => ({
      ...prev,
      [camId]: !prev[camId],
    }));
  };

  const addCameraTab = () => {
    if(cameras.length >= 8) return; 
    const newCamNumber = cameras.length + 1;
    setCameras([...cameras, `CAM${newCamNumber}`]);
  };

  const removeCameraTab = () => {
    if (cameras.length > 2) {
      setCameras(cameras.slice(0, -1));
    }
  };

  // Helper to grab the correct WebRTC stream from our producer list based on the Tab Name
  const getStreamByCam = (camName) => {
    const target = producers.find(p => p.name === camName);
    return target ? target.stream : null;
  };

  useEffect(() => {
    if (typeof GstWebRTCAPI === "undefined") {
      console.error("GstWebRTCAPI not found.");
      return;
    }

    const signalingProtocol = window.location.protocol.startsWith("https") ? "wss" : "ws";
    const api = new GstWebRTCAPI({
      meta: { name: `WebClient-${Date.now()}` },
      signalingServerUrl: `${signalingProtocol}://localhost:8443`,
    });

    const listener = {
      producerAdded: function (producer) {
        if (activeSessionsRef.current[producer.id]) return;

        const session = api.createConsumerSession(producer.id);
        if (!session) return;

        activeSessionsRef.current[producer.id] = session;
        session.mungeStereoHack = true;

        session.addEventListener("streamsChanged", () => {
          if (session.streams.length > 0) {
            setProducers((prev) => {
              const filtered = prev.filter((p) => p.id !== producer.id);
              return [
                ...filtered,
                {
                  id: producer.id,
                  name: producer.meta?.name || `CAM${prev.length + 1}`, // Fallback if meta name is missing
                  stream: session.streams[0],
                },
              ];
            });
          }
        });

        session.addEventListener("closed", () => {
          delete activeSessionsRef.current[producer.id];
          setProducers((prev) => prev.filter((p) => p.id !== producer.id));
        });

        session.connect();
      },
      producerRemoved: function (producer) {
        if (activeSessionsRef.current[producer.id]) {
          activeSessionsRef.current[producer.id].close();
        }
      }
    };

    api.registerProducersListener(listener);
    for (const producer of api.getAvailableProducers()) {
      listener.producerAdded(producer);
    }

    return () => {
      Object.values(activeSessionsRef.current).forEach(session => session.close());
      activeSessionsRef.current = {};
    };
  }, []);

  // Helper to render a stream container
  const RenderStream = ({ stream, label, className = "" }) => (
    <div className={`bg-black border border-slate-600 relative overflow-hidden ${className}`}>
      {stream ? (
        <CameraStream stream={stream} label={label} />
      ) : (
        <div className="flex items-center justify-center h-full text-slate-700 font-bold text-xs">
          NO SIGNAL ({label})
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-700 h-full flex flex-col font-sans text-slate-200">
      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 text-[10px] font-bold tracking-widest">
        <div className="flex overflow-x-auto">
          {cameras.map((tab) => (
            <TabButton
              key={tab}
              active={activeCameraTab === tab}
              onClick={() => setActiveCameraTab(tab)}
              className="px-4 py-2 flex-1"
            >
              {tab}
            </TabButton>
          ))}

          <TabButton key="FULL" active={activeCameraTab === "FULL"} onClick={() => setActiveCameraTab("FULL")} className="px-4 py-2">
            FULL
          </TabButton>
          <TabButton key="MINUS" onClick={removeCameraTab} className="px-3 py-2 text-red-400 bg-slate-800 hover:bg-slate-700">-</TabButton>
          <TabButton key="PLUS" onClick={addCameraTab} className="px-3 py-2 text-green-400 bg-slate-800 hover:bg-slate-700">+</TabButton>
        </div>
      </div>

      {/* Main video display */}
      <div className="p-2 flex-1 flex flex-col min-h-0">
        <div className="flex-1 mb-2">
          {activeCameraTab !== "FULL" ? (
            <div className="grid grid-rows-[1fr,auto] gap-1 h-full">
              {/* Primary Focus Camera */}
              <div
                key={activeCameraTab}
                onClick={() => toggleFlip(activeCameraTab)}
                className="cursor-pointer transition-transform duration-300 ease-in-out"
                style={{ transform: !!flippedCameras[activeCameraTab] ? 'rotate(180deg)' : 'none' }}
              >
                <RenderStream
                  stream={getStreamByCam(activeCameraTab)}
                  label={activeCameraTab}
                  className="aspect-video pointer-events-none"
                />
              </div>
                
              {/* Secondary Bottom Row */}
              <div className="grid grid-cols-2 gap-1">
                {cameras
                  .filter((cam) => cam !== activeCameraTab)
                  .map((cam) => (
                    <div
                      key={cam}
                      onClick={() => toggleFlip(cam)}
                      className="cursor-pointer transition-transform duration-300 ease-in-out"
                      style={{ transform: !!flippedCameras[cam] ? 'rotate(180deg)' : 'none' }}
                    >
                      <RenderStream
                        stream={getStreamByCam(cam)}
                        label={cam}
                        className="aspect-video pointer-events-none"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* Fullscreen Grid Layout */
            <div className="grid grid-cols-3 gap-1 w-full relative">
              {cameras.map((cam) => (
                <div 
                  key={cam} 
                  onClick={() => toggleFlip(cam)}
                  className="cursor-pointer transition-transform duration-300"
                  style={{ transform: !!flippedCameras[cam] ? 'rotate(180deg)' : 'none' }}
                >
                  <RenderStream 
                    stream={getStreamByCam(cam)}
                    label={cam}
                    className="aspect-video pointer-events-none" 
                  />
                </div>
              ))}

              {/* Keeping your ROS Panels intact */}
              <RosImagePanel topicName={"/detection_image"}></RosImagePanel>
              <RosImagePanel topicName={"/panorama"}></RosImagePanel>
            </div>
          )}
        </div>

        {/* Camera status info */}
        <div className="space-y-1 text-[10px] uppercase tracking-tighter border-t border-slate-800 pt-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Network:</span>
            <span className={`${producers.length > 0 ? 'text-green-400' : 'text-red-500'} font-mono`}>
              {producers.length > 0 ? `${producers.length} Streams Connected` : 'Searching for Peers...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraPanel;