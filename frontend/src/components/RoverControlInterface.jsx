import React, { useEffect, useRef, useState } from 'react';
import { Battery, Compass, MapPin, Zap, Activity, Wifi, WifiOff, Settings, Camera, Map, Navigation } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import '../output.css';
import Header from './Header';
import ControlPanel from './panels/ControlPanel';
import CameraPanel from './panels/CameraPanelCV';
import TerminalTabs from './TerminalTabs';
import RosImagePanel from './panels/TempDepthPanel';
import MapWrapper from './panels/MapWrapper';


const RoverControlInterface = () => {

  const terminalRegistry = useRef({});

  const registerTerminal = (id, instance) => {
    terminalRegistry.current[id] = instance;
  };

  const injectCommand = (targetId, cmd) => {
    const targetTerminal = terminalRegistry.current[targetId];
    if (targetTerminal && cmd != '') {
      targetTerminal.execute(cmd);
    } else {
      console.error(`Terminal ${targetId} not found or not initialized.`);
    }
  };
  
  

  // These gnssCoords must be sorted by the pathfinding function before getting passed in here (in terms of optimum path)

  return (
    <div className="bg-black text-green-400 h-screen p-2 font-mono text-xs overflow-hidden flex flex-col space-y-2"> 
      <Header></Header> 
      
      <PanelGroup direction="horizontal">
        
        {/* Left Panel - Controls */} 
        <Panel className="panel" defaultSize={25}>

          <PanelGroup direction="vertical">
          
          {/* Control Tabs */} 
          <Panel className="panel">
          <ControlPanel onAction={injectCommand}/> 
          </Panel>

          <PanelResizeHandle className="h-2">
            <div className="h-full hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>

          {/* Diagnostics */} 
          <Panel className="panel">
          <TerminalTabs onTerminalInit={registerTerminal}/> 
          </Panel>
          
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="w-2">
            <div className="h-full hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>

        <Panel className="panel" defaultSize={50}>
        {/* <RosImagePanel topicName="/bottle_image" />  */}
        <CameraPanel/>
        </Panel>
      
        <PanelResizeHandle className="w-2">
            <div className="h-full hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>


        <Panel className="panel" defaultSize={25}>
        
        <MapWrapper/>
        </Panel>

      </PanelGroup>
      
    </div>
  );
};

export default RoverControlInterface;