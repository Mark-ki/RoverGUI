import React, { useState } from "react";
import ConsolePanel from "./panels/ConsolePanel";

// Assuming TabButton is imported or defined nearby
const TabButton = ({ children, active, onClick, className }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1 border-t border-l border-r border-slate-700 text-xs font-mono transition-colors ${
      active 
        ? "bg-slate-800 text-green-400 border-b-transparent" 
        : "bg-slate-900 text-slate-500 border-b-slate-700 hover:text-slate-300"
    } ${className}`}
  >
    {children}
  </button>
);

const TerminalTabs = ({ onTerminalInit }) => {
  const tabs = ["Terminal 1", "Terminal 2"];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Tab Header Mapping */}
      <div className="flex bg-slate-950">
        {tabs.map((tab) => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 text-center"
          >
            {tab.toUpperCase()}
          </TabButton>
        ))}
      </div>

      {/* Terminal Container */}
      <div className="relative flex-1 min-h-0 border-l border-r border-b border-slate-700">
        {tabs.map((tab) => (
          <div
            key={tab}
            className="absolute inset-0"
            style={{
              display: activeTab === tab ? "block" : "none",
            }}
          >
            {/* PRO TIP: If the terminal looks "squished" when switching back, 
               ensure ConsolePanel's handleResize is triggered when activeTab changes.
            */}
            <ConsolePanel onInit={(inst) => onTerminalInit(tab, inst)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalTabs;