import React, { useEffect, useRef, useState } from 'react';

interface HandTrackerProps {
  onInteraction: () => void;
}

// Constant ID for simulated pointer to ensure capture release works correctly
const SIMULATED_POINTER_ID = 12345;

export const HandTracker: React.FC<HandTrackerProps> = ({ onInteraction }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // State to track gestures
  const lastClickTime = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !window.Hands || !window.Camera) return;

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 320,
      height: 240,
    });

    camera.start();
    setIsReady(true);

    return () => {
      camera.stop(); 
    };
  }, []);

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    // Draw visual feedback
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.translate(canvasRef.current.width, 0);
    canvasCtx.scale(-1, 1);
    
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      
      if (window.drawConnectors && window.drawLandmarks) {
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        window.drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 2 });
      }

      // 1. GESTURE RECOGNITION (Click)
      const extendedFingers = countExtendedFingers(landmarks);
      const isClickGesture = extendedFingers === 5 || extendedFingers <= 1;

      if (isClickGesture) {
        const now = Date.now();
        if (now - lastClickTime.current > 1500) {
          lastClickTime.current = now;
          onInteraction();
          
          canvasCtx.fillStyle = 'rgba(255, 215, 0, 0.5)';
          canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }

      // 2. GESTURE: DRAG
      const palmCenter = landmarks[9];
      simulateDrag(palmCenter);

    } else {
      // No hand detected - release drag if active
      if (isDragging.current) {
        // Must target the canvas to release capture correctly
        const targetElement = document.querySelector('canvas');
        if (targetElement) {
           dispatchPointerEvent('pointerup', 0, 0, targetElement);
        }
        isDragging.current = false;
      }
    }
    
    canvasCtx.restore();
  };

  const countExtendedFingers = (landmarks: any[]): number => {
    const fingerTips = [4, 8, 12, 16, 20];
    const fingerPips = [3, 6, 10, 14, 18]; 
    
    let extendedCount = 0;
    const wrist = landmarks[0];

    for (let i = 0; i < 5; i++) {
        const tip = landmarks[fingerTips[i]];
        const pip = landmarks[fingerPips[i]];
        const dTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        const dPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
        if (dTip > dPip) {
            extendedCount++;
        }
    }
    return extendedCount;
  };

  const simulateDrag = (point: { x: number, y: number }) => {
    const screenX = (1 - point.x) * window.innerWidth; 
    const screenY = point.y * window.innerHeight;
    const targetElement = document.querySelector('canvas'); 
    
    if (targetElement) {
        if (!isDragging.current) {
            dispatchPointerEvent('pointerdown', screenX, screenY, targetElement);
            isDragging.current = true;
        }
        dispatchPointerEvent('pointermove', screenX, screenY, targetElement);
    }
  };

  const dispatchPointerEvent = (type: string, clientX: number, clientY: number, target: Element) => {
    const event = new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clientX,
      clientY: clientY,
      buttons: 1,
      pointerType: 'mouse',
      isPrimary: true,
      pointerId: SIMULATED_POINTER_ID // Ensure consistent ID for capture/release
    });
    target.dispatchEvent(event);
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 flex flex-col items-center">
      <div className="relative rounded-lg overflow-hidden border-2 border-yellow-500/50 shadow-[0_0_20px_rgba(255,215,0,0.3)] bg-black/80">
        <video 
          ref={videoRef}
          className="input_video w-40 h-32 object-cover opacity-50 absolute inset-0" 
          playsInline
        />
        <canvas 
          ref={canvasRef}
          className="output_canvas w-40 h-32 relative z-10"
          width={320}
          height={240}
        />
        {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-yellow-500 bg-black/90">
                Loading Camera...
            </div>
        )}
      </div>
      <div className="mt-2 text-[10px] text-yellow-500/80 font-mono text-center bg-black/50 px-2 py-1 rounded">
        HAND TRACKING ACTIVE<br/>
        Open OR Close Hand = Click
      </div>
    </div>
  );
};
