import React, { useState } from 'react';
import TabButton from '../TabButton';

const ControlPanel = ({ activeTab, setActiveTab }) => {
    const [activeControlTab, setActiveControlTab] = useState('Launch');
    
  return (
    <div className="bg-slate-900 border border-slate-700 h-full">
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
                      <div className="text-slate-400">VEL X</div>
                      <div className="text-green-400 font-bold">3.00m/s</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">VEL Y</div>
                      <div className="text-green-400 font-bold">4.00m/s</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">ACC</div>
                      <div className="text-green-400 font-bold">4.00m/s^2</div>
                    </div>
                    <div className="bg-slate-800 p-2">
                      <div className="text-slate-400">Compass</div>
                      <div className="text-green-400 font-bold">90°</div>
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
  );
};
export default ControlPanel;
