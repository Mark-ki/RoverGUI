import React, { useRef } from 'react';
import { Battery, Compass, MapPin, Zap, Activity, Wifi, WifiOff, Settings, Camera, Map, Navigation } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import '../output.css';
import Header from './Header';
import DiagnosticsPanel from './panels/DiagnosticPanel';
import ControlPanel from './panels/ControlPanel';
import MapPanel from './panels/MapPanel';
import CameraPanel from './panels/CameraPanelCV';
import ConsolePanel from './panels/ConsolePanel';
import TerminalTabs from './TerminalTabs';


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
        <CameraPanel /> 
        </Panel>
      
        <PanelResizeHandle className="w-2">
            <div className="h-full hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>


        <Panel className="panel" defaultSize={25}>
        <MapPanel /> 
        </Panel>

      </PanelGroup>
      
    </div>
  );
};

export default RoverControlInterface;