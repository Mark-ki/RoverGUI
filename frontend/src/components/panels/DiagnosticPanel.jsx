import React, { useState } from 'react';
import TabButton from '../TabButton';

const DiagnosticPanel = () => {
  const [activeTab, setActiveTab] = useState('Diagnostic');

  const logs = {
    Diagnostic: [
      { type: 'err', text: '[ERR] WebSocket connection failed: timeout' },
      { type: 'warn', text: '[WARN] Connection lost, attempting reconnect...' },
      { type: 'warn', text: '[WARN] Retry attempt 1/5' },
      { type: 'ok', text: '[OK] WebSocket reconnected successfully' },
      { type: 'info', text: '[INFO] Motor systems online' },
      { type: 'info', text: '[INFO] Camera feed active' },
      { type: 'err', text: '[ERR] WebSocket connection failed: timeout' },
      { type: 'warn', text: '[WARN] Connection lost, attempting reconnect...' },
      { type: 'warn', text: '[WARN] Retry attempt 1/5' },
      { type: 'ok', text: '[OK] WebSocket reconnected successfully' },
      { type: 'info', text: '[INFO] Motor systems online' },
      { type: 'info', text: '[INFO] Camera feed active' },
      { type: 'err', text: '[ERR] WebSocket connection failed: timeout' },
      { type: 'warn', text: '[WARN] Connection lost, attempting reconnect...' },
      { type: 'warn', text: '[WARN] Retry attempt 1/5' },
      { type: 'ok', text: '[OK] WebSocket reconnected successfully' },
      { type: 'info', text: '[INFO] Motor systems online' },
      { type: 'info', text: '[INFO] Camera feed active' },
      { type: 'err', text: '[ERR] WebSocket connection failed: timeout' },
      { type: 'warn', text: '[WARN] Connection lost, attempting reconnect...' },
      { type: 'warn', text: '[WARN] Retry attempt 1/5' },
      { type: 'ok', text: '[OK] WebSocket reconnected successfully' },
      { type: 'info', text: '[INFO] Motor systems online' },
      { type: 'info', text: '[INFO] Camera feed active' },
      { type: 'err', text: '[ERR] WebSocket connection failed: timeout' },
      { type: 'warn', text: '[WARN] Connection lost, attempting reconnect...' },
      { type: 'warn', text: '[WARN] Retry attempt 1/5' },
      { type: 'ok', text: '[OK] WebSocket reconnected successfully' },
      { type: 'info', text: '[INFO] Motor systems online' },
      { type: 'info', text: '[INFO] Camera feed active' },
    ],
    Network: [
      { type: 'info', text: '[INFO] IP Address: 192.168.1.12' },
      { type: 'info', text: '[INFO] Latency: 120ms' },
      { type: 'warn', text: '[WARN] Packet loss detected (3%)' },
      { type: 'ok', text: '[OK] Link stable' },
    ],
    System: [
      { type: 'info', text: '[INFO] CPU Temp: 67°C' },
      { type: 'info', text: '[INFO] RAM Usage: 42%' },
      { type: 'warn', text: '[WARN] Disk space low: 12%' },
      { type: 'ok', text: '[OK] Cooling system active' },
    ],
  };

  const colorMap = {
    err: 'text-red-400',
    warn: 'text-yellow-400',
    ok: 'text-green-400',
    info: 'text-slate-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-700 h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700 flex">
        {Object.keys(logs).map((tab) => (
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

      {/* Log content */}
      <div className="p-2 h-full overflow-y-auto text-xs font-mono scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
        {logs[activeTab].map((log, idx) => (
          <div key={idx} className={colorMap[log.type]}>
            {log.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiagnosticPanel;
