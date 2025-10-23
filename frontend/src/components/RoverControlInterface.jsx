import React, { useState } from 'react';
import { Battery, Compass, MapPin, Zap, Activity, Wifi, WifiOff, Settings, Camera, Map, Navigation } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import '../output.css';
import Header from './Header';
import DiagnosticsPanel from './panels/DiagnosticPanel';
import ControlPanel from './panels/ControlPanel';
import MapPanel from './panels/MapPanel';
import CameraPanel from './panels/CameraPanel';


const RoverControlInterface = () => {
  return (
    <div className="bg-black text-green-400 h-screen p-2 font-mono text-xs overflow-hidden"> 
      <Header></Header> 
      
      <PanelGroup direction="horizontal">
        
        {/* Left Panel - Controls */} 
        <Panel className="panel">

          <PanelGroup direction="vertical">
          
          {/* Control Tabs */} 
          <Panel className="panel">
          <ControlPanel /> 
          </Panel>

          <PanelResizeHandle className="h-1">
            <div className="h-full bg-gray-600 hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>

          {/* Diagnostics */} 
          <Panel className="panel">
          <DiagnosticsPanel /> 
          </Panel>
          
          </PanelGroup>
        </Panel>
        
        <PanelResizeHandle className="w-1">
            <div className="h-full bg-gray-600 hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>

        <Panel className="panel">
        <CameraPanel /> 
        </Panel>
      
        <PanelResizeHandle className="w-1">
            <div className="h-full bg-gray-600 hover:bg-green-400 transition-colors"></div>
          </PanelResizeHandle>


        <Panel className="panel">
        <MapPanel /> 
        </Panel>

      </PanelGroup>
      
    </div>
  );
};

export default RoverControlInterface;