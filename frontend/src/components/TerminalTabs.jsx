import React, { useState } from "react";
import ConsolePanel from "./panels/ConsolePanel";

const TerminalTabs = () => {
  const [activeTab, setActiveTab] = useState("tab1");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab buttons */}
      <div style={{ display: "flex" }}>
        <button
          onClick={() => setActiveTab("tab1")}
          style={{
            padding: "4px 8px",
            border: "1px solid gray",
            borderBottom: activeTab === "tab1" ? "none" : "1px solid gray",
          }}
        >
          Terminal 1
        </button>
        <button
          onClick={() => setActiveTab("tab2")}
          style={{
            padding: "4px 8px",
            border: "1px solid gray",
            borderBottom: activeTab === "tab2" ? "none" : "1px solid gray",
          }}
        >
          Terminal 2
        </button>
      </div>

      {/* Both terminals stay mounted; we just hide one */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: activeTab === "tab1" ? "block" : "none",
          }}
        >
          <ConsolePanel />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: activeTab === "tab2" ? "block" : "none",
          }}
        >
          <ConsolePanel />
        </div>
      </div>
    </div>
  );
};

export default TerminalTabs;
