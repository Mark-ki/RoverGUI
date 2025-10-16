import React, { useState } from 'react';
import { Battery, Compass, MapPin, Zap, Activity, Wifi, WifiOff, Settings, Camera, Map, Navigation } from 'lucide-react';
import './output.css';

const RoverControlInterface = () => {
  const [activeControlTab, setActiveControlTab] = useState('Launch');
  const [activeCameraTab, setActiveCameraTab] = useState('Cam 1');

  const TabButton = ({ active, onClick, children, className = "" }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono uppercase transition-all duration-100 ${
        active
          ? 'text-green-400 bg-slate-700 border-l-2 border-green-400'
          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/50'
      } ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-black text-green-400 h-screen p-2 font-mono text-xs overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-700 p-2 mb-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">μR</div>
          <span className="text-green-400 font-bold">ROVER CONTROL v2.1.3</span>
          <span className="text-slate-500">|</span>
          <span className="text-yellow-400">STATUS: OPERATIONAL</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-green-400">●</span>
          <span>WS://192.168.1.100:8080</span>
          <span className="text-slate-500">RSSI: -42dBm</span>
          <span className="text-slate-500">LAT: 14.2ms</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 h-[calc(100vh-80px)]">
        {/* Left Panel - Controls */}
        <div className="space-y-2">
          {/* Control Tabs */}
          <div className="bg-slate-900 border border-slate-700">
            <div className="bg-slate-800 border-b border-slate-700 flex">
              {['Launch', 'Data', 'Motor'].map((tab) => (
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
            
            <div className="p-3 space-y-3">
              {activeControlTab === 'Launch' && (
                <>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>AMPERE</span>
                      <span className="text-green-400">9.0A</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded">
                      <div className="bg-green-400 h-2 rounded" style={{width: '60%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>BATTERY</span>
                      <span className="text-yellow-400">40%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded">
                      <div className="bg-yellow-400 h-2 rounded" style={{width: '40%'}}></div>
                    </div>
                  </div>
                  
                  <button className="w-full bg-red-600 text-white py-1 text-xs hover:bg-red-700 transition-colors">
                    EMERGENCY STOP
                  </button>
                </>
              )}
              
              {activeControlTab === 'Data' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">COORD X</div>
                      <div className="text-green-400 font-bold">7.00</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">COORD Y</div>
                      <div className="text-green-400 font-bold">2.00</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">DIST</div>
                      <div className="text-green-400 font-bold">4.00m</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">HDG</div>
                      <div className="text-green-400 font-bold">306.97°</div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeControlTab === 'Motor' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">VEL X</div>
                      <div className="text-cyan-400 font-bold">5.00m/s</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">VEL Y</div>
                      <div className="text-cyan-400 font-bold">0.00m/s</div>
                    </div>
                    <div className="bg-slate-800 p-2 col-span-2">
                      <div className="text-slate-400">ACCEL</div>
                      <div className="text-cyan-400 font-bold">2.00m/s²</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostics */}
          <div className="bg-slate-900 border border-slate-700 flex-1">
            <div className="bg-slate-800 border-b border-slate-700 p-2">
              <span className="text-xs">DIAGNOSTIC LOG</span>
            </div>
            <div className="p-2 h-32 overflow-y-auto text-xs font-mono">
              <div className="space-y-0.5">
                <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
                <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
                <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
                <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
                <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
                <div className="text-slate-400">[INFO] Motor systems online</div>
                <div className="text-slate-400">[INFO] Camera feed active</div>
                <div className="text-slate-400">[INFO] GPS lock acquired</div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Panel - Map */}
        <div className="col-span-2 bg-slate-900 border border-slate-700">
          <div className="bg-slate-800 border-b border-slate-700 p-2 flex justify-between items-center">
            <span className="text-xs">NAVIGATION MAP</span>
            <div className="flex space-x-2 text-xs">
              <span className="text-green-400">GPS LOCK</span>
              <span className="text-slate-500">|</span>
              <span>ZOOM: 1:500</span>
            </div>
          </div>
          
          <div className="relative bg-slate-800 h-full p-4">
            {/* Simulated map grid */}
            <svg className="absolute inset-4" viewBox="0 0 400 300">
              {/* Grid lines */}
              {[...Array(20)].map((_, i) => (
                <line key={`v${i}`} x1={i*20} y1="0" x2={i*20} y2="300" stroke="#374151" strokeWidth="0.5"/>
              ))}
              {[...Array(15)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i*20} x2="400" y2={i*20} stroke="#374151" strokeWidth="0.5"/>
              ))}
              
              {/* Path trace */}
              <polyline 
                points="50,250 100,200 150,180 200,160 250,140 300,120" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2"
                strokeDasharray="3,2"
              />
              
              {/* Rover position */}
              <circle cx="300" cy="120" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1"/>
              <text x="310" y="125" fill="#10b981" fontSize="8">ROVER</text>
              
              {/* Waypoints */}
              <circle cx="350" cy="100" r="2" fill="#fbbf24"/>
              <text x="355" y="105" fill="#fbbf24" fontSize="6">WP1</text>
              
              {/* Obstacles */}
              <rect x="180" y="200" width="20" height="15" fill="#ef4444" opacity="0.5"/>
              <rect x="220" y="180" width="15" height="20" fill="#ef4444" opacity="0.5"/>
            </svg>
            
            {/* Map controls */}
            <div className="absolute top-4 right-4 space-y-1">
              <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">+</button>
              <button className="bg-slate-700 text-green-400 w-6 h-6 text-xs hover:bg-slate-600">-</button>
            </div>
            
            {/* Coordinates display */}
            <div className="absolute bottom-4 left-4 text-xs space-y-1">
              <div>LAT: 40.7128° N</div>
              <div>LON: 74.0060° W</div>
              <div>ALT: 10.2m</div>
            </div>
          </div>
        </div>

        {/* Right Panel - Cameras */}
        <div className="bg-slate-900 border border-slate-700">
          <div className="bg-slate-800 border-b border-slate-700 text-xs">
            <div className="grid grid-cols-5">
              {['CAM1', 'CAM2', 'CAM3', 'CAM4', 'MULTI'].map((tab) => (
                <TabButton
                  key={tab}
                  active={activeCameraTab === tab.replace('CAM', 'Cam ')}
                  onClick={() => setActiveCameraTab(tab.replace('CAM', 'Cam '))}
                  className="text-center py-2"
                >
                  {tab}
                </TabButton>
              ))}
            </div>
          </div>
          
          <div className="p-2">
            {activeCameraTab !== 'Multi' && (
              <div className="bg-black border border-slate-600 aspect-video mb-2 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-green-400 text-center">
                    <div className="text-xs mb-1">● {activeCameraTab.toUpperCase()} FEED</div>
                    <div className="text-xs text-slate-500">1280x720 • 30fps</div>
                  </div>
                </div>
                <div className="absolute top-2 left-2 text-xs text-green-400">
                  REC ● 00:15:42
                </div>
                <div className="absolute bottom-2 left-2 text-xs text-green-400">
                  RSSI: -35dBm
                </div>
              </div>
            )}
            
            {activeCameraTab === 'Multi' && (
              <div className="grid grid-cols-2 gap-1 mb-2">
                {[1, 2, 3, 4].map((cam) => (
                  <div key={cam} className="bg-black border border-slate-600 aspect-video relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-green-400 text-xs">CAM{cam}</div>
                    </div>
                    <div className="absolute top-1 left-1 text-xs text-green-400">●</div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Camera controls */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>EXPOSURE:</span>
                <span className="text-green-400">AUTO</span>
              </div>
              <div className="flex justify-between">
                <span>FOCUS:</span>
                <span className="text-green-400">∞</span>
              </div>
              <div className="flex justify-between">
                <span>NIGHT MODE:</span>
                <span className="text-red-400">OFF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoverControlInterface;