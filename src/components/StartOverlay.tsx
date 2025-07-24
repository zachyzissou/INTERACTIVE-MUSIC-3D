"use client";
import React, { useState } from "react";

interface StartOverlayProps {
  readonly onFinish: () => Promise<boolean>;
  readonly progress?: number;
}

export default function StartOverlay({ onFinish, progress = 0 }: StartOverlayProps) {
  const [exiting, setExiting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const handleClick = React.useCallback(async () => {
    setIsInitializing(true);
    setExiting(true);
    const success = await onFinish();
    if (!success) {
      // Re-show overlay if audio failed to start
      setExiting(false);
      setIsInitializing(false);
    }
  }, [onFinish]);

  if (exiting) {
    return null;
  }

  return (
    <div
      data-testid="start-overlay"
      className="fixed z-[9999] flex items-center justify-center text-white select-none cursor-pointer"
      style={{
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: "radial-gradient(circle at center, rgba(0,0,0,0.95), #000000 80%)",
      }}
      onClick={handleClick}
    >
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: '30%' }}
      >
        {!isInitializing ? (
          <>
            <p
              data-testid="start-button"
              className="z-10 text-xl md:text-3xl font-semibold hover:text-blue-400 transition-colors duration-300"
            >
              Let&apos;s begin your sonic voyage…
            </p>
            <p className="text-sm md:text-base text-gray-300 mt-4">
              Click anywhere to start
            </p>
          </>
        ) : (
          <>
            <p className="z-10 text-xl md:text-3xl font-semibold text-cyan-400 mb-6">
              Initializing Audio Engine...
            </p>
            
            {/* Progress Bar */}
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress Text */}
            <p className="text-sm text-gray-300">
              {progress < 50 ? 'Starting audio context...' : 
               progress < 90 ? 'Loading audio systems...' : 
               'Almost ready...'}
            </p>
            
            {/* Animated Loading Dots */}
            <div className="flex justify-center space-x-1 mt-4">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}