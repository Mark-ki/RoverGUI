import React, { useEffect, useRef, useState } from 'react';
import { useRosTopic } from '../../useRosTopic';

const RosImagePanel = ({ topicName }) => {
  const imageData = useRosTopic(topicName, 'sensor_msgs/msg/CompressedImage', 33); 
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // 1. Add state to track if this panel is maximized
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!imageData || !imageData.data || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    
    const img = new Image();
    
    img.onload = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio); 
      
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img, 
        0, 0, img.width, img.height,               
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio 
      );
    };

    const format = imageData.format.toLowerCase().includes('png') ? 'png' : 'jpeg';
    img.src = `data:image/${format};base64,${imageData.data}`;
    
    // 2. Add `isExpanded` to the dependency array so the canvas recalculates 
    // its size and redraws the moment the panel enlarges.
  }, [imageData, isExpanded]);

  return (
    <div 
      ref={containerRef} 
      onClick={() => setIsExpanded(!isExpanded)}
      // 3. Toggle between absolute overlay (expanded) and normal relative flow
      className={`
        bg-black border border-slate-600 overflow-hidden cursor-pointer
        ${isExpanded ? 'absolute inset-0 z-50' : 'relative w-full h-full'}
      `}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full" 
      />


      <div className="absolute top-1 right-1 text-[10px] font-bold text-green-400 bg-black/40 px-1 rounded">
        ● {topicName}
      </div>

      {/* Optional visual hint for the user */}
      <div className="absolute bottom-1 right-1 text-[10px] text-slate-400 bg-black/40 px-1 rounded pointer-events-none">
        {isExpanded ? 'Click to minimize' : 'Click to expand'}
      </div>
{/* 
      {!imageData && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-slate-600 text-[10px] font-mono animate-pulse">NO SIGNAL</span>
        </div>
      )} */}
    </div>
  );
};

export default RosImagePanel;

