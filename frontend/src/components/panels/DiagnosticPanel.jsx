import React, { useState } from 'react';

const ConsolePanel = () => {
  return(
  <div className="bg-slate-900 border border-slate-700 flex-1 h-full">
        <div className="bg-slate-800 border-b border-slate-700 p-2">
            <span className="text-xs">DIAGNOSTIC LOG</span>
        </div>
        <div className="p-2 h-full overflow-y-auto text-xs font-mono space-y-0.5">
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
            <div className="text-red-400">[ERR] WebSocket connection failed: timeout</div>
            <div className="text-yellow-400">[WARN] Connection lost, attempting reconnect...</div>
            <div className="text-yellow-400">[WARN] Retry attempt 1/5</div>
            <div className="text-yellow-400">[WARN] Retry attempt 2/5</div>
            <div className="text-green-400">[OK] WebSocket reconnected successfully</div>
            <div className="text-slate-400">[INFO] Motor systems online</div>
            <div className="text-slate-400">[INFO] Camera feed active</div>
            <div className="text-slate-400">[INFO] GPS lock acquired</div>
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
    
  );
};

export default ConsolePanel;
