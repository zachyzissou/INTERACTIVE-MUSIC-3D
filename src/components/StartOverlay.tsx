"use client";
import React, { useState } from "react";

interface StartOverlayProps {
  readonly onFinish: () => Promise<boolean>;
}

export default function StartOverlay({ onFinish }: StartOverlayProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = React.useCallback(async () => {
    setExiting(true);
    const success = await onFinish();
    if (!success) {
      // Re-show overlay if audio failed to start
      setExiting(false);
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p
          data-testid="start-button"
          className="z-10 text-xl md:text-3xl font-semibold hover:text-blue-400 transition-colors duration-300"
        >
          Let&apos;s begin your sonic voyage…
        </p>
        <p className="text-sm md:text-base text-gray-300 mt-4">
          Click anywhere to start
        </p>
      </div>
    </div>
  );
}