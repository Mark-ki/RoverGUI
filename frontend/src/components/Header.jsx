import React from 'react';


const HeaderBar = () => {
return (
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
);
};


export default HeaderBar;