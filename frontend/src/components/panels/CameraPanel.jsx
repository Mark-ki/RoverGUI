import React, { useState }  from "react";
import TabButton from '../TabButton';

const CameralPanel = () => {

    const [activeCameraTab, setActiveCameraTab] = useState('Cam 1');
    

    return(
        <div className="bg-slate-900 border border-slate-700 h-full">
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
    );
};
export default CameralPanel;