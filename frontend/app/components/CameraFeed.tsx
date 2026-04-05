"use client";

import React, { useEffect, useRef, forwardRef, useState } from "react";
import Webcam from "react-webcam";

interface DetectedFace {
  bbox: number[];
  name?: string;
  is_unknown?: boolean;
}

interface CameraFeedProps {
  onCapture?: (screenshot: string) => void;
  showOverlay?: boolean;
  detectedFaces?: DetectedFace[];
  width?: number;
  height?: number;
}

const CameraFeed = forwardRef<Webcam, CameraFeedProps>(
  (
    {
      onCapture,
      showOverlay = false,
      detectedFaces = [],
      width = 640,
      height = 480,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      if (!showOverlay || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear the canvas before drawing new frames
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detectedFaces && detectedFaces.length > 0) {
        detectedFaces.forEach((face) => {
          if (!face.bbox || face.bbox.length < 4) return;
          
          const [x1, y1, x2, y2] = face.bbox;
          const w = x2 - x1;
          const h = y2 - y1;
          
          const isUnknown = face.is_unknown || !face.name;
          const color = isUnknown ? "#ef4444" : "#22c55e"; // red or green
          const text = isUnknown ? "Unknown" : face.name!;

          // Draw Box
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, w, h);

          // Draw Text Background (Below Rect)
          ctx.fillStyle = color;
          ctx.fillRect(x1 - (ctx.lineWidth / 2), y2, w + ctx.lineWidth, 26);

          // Draw Text
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 14px Arial";
          ctx.fillText(text, x1 + 5, y2 + 18);
        });
      }
    }, [detectedFaces, showOverlay, width, height]);

    if (hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center bg-gray-900 rounded-lg shadow-inner border border-gray-800"
          style={{ width, height, minWidth: "100%", maxWidth: "100%" }}
        >
          <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
          <p className="text-white font-medium">Camera not available</p>
          <p className="text-gray-400 text-sm mt-1">Please check permissions and connections.</p>
        </div>
      );
    }

    return (
      <div 
        className="relative bg-black rounded-lg overflow-hidden shadow-sm border border-gray-800 flex items-center justify-center"
        style={{ width, height, maxWidth: "100%", minWidth: "100%" }}
      >
        <Webcam
          ref={ref}
          audio={false}
          width={width}
          height={height}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width, height, facingMode: "user" }}
          onUserMediaError={() => setHasError(true)}
          className="object-cover"
          style={{ width: "100%", height: "100%" }}
        />
        
        {showOverlay && (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="absolute inset-0 object-cover pointer-events-none"
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>
    );
  }
);

CameraFeed.displayName = "CameraFeed";

export default CameraFeed;
