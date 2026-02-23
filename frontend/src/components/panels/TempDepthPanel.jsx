import React, { useEffect, useRef } from 'react';
import { useRosTopic } from '../../useRosTopic'; // Path to your hook

const RosImagePanel = ({ topicName }) => {
  // Change 1ms to 33ms (30fps) to prevent React from choking
  const imageData = useRosTopic(topicName, 'sensor_msgs/msg/Image', 1000); 
  const canvasRef = useRef(null);

  useEffect(() => {
  if (!imageData || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  // 1. Determine if it's Raw or Compressed
  // Raw messages have an 'encoding' field like 'rgb8' or 'bgr8'
  const isRaw = imageData.encoding !== undefined;

  if (isRaw) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const imgData = ctx.createImageData(imageData.width, imageData.height);
    
    // Decode Base64 string to a byte array (Rosbridge sends raw data as Base64)
    const binaryString = window.atob(imageData.data);
    
    for (let i = 0; i < (imageData.width * imageData.height); i++) {
      const srcIdx = i * 3;
      const destIdx = i * 4;

      // Map RGB to RGBA
      imgData.data[destIdx]     = binaryString.charCodeAt(srcIdx);     // R
      imgData.data[destIdx + 1] = binaryString.charCodeAt(srcIdx + 1); // G
      imgData.data[destIdx + 2] = binaryString.charCodeAt(srcIdx + 2); // B
      imgData.data[destIdx + 3] = 255;                                 // A (Alpha)
    }

    ctx.putImageData(imgData, 0, 0);

  } else {
    // FALLBACK: Compressed Image (JPEG/PNG)
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/jpeg;base64,${imageData.data}`;
  }
}, [imageData]);


  return (
    <div className="image-panel" style={styles.container}>
      <h3 style={styles.title}>{topicName}</h3>
      <div style={styles.canvasWrapper}>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>
      {!imageData && <div style={styles.placeholder}>Waiting for stream...</div>}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1e1e1e',
    padding: '10px',
    borderRadius: '8px',
    color: 'white',
    width: 'fit-content'
  },
  canvasWrapper: {
    border: '2px solid #333',
    lineHeight: 0
  },
  canvas: {
    maxWidth: '100%',
    height: 'auto',
    display: 'block'
  },
  placeholder: {
    padding: '20px',
    textAlign: 'center',
    color: '#666'
  }
};

export default RosImagePanel;