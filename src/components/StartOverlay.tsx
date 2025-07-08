"use client";
import React, { useState } from "react";

interface StartOverlayProps {
  readonly onFinish: () => void;
}

export default function StartOverlay({ onFinish }: StartOverlayProps) {
  const [exiting, setExiting] = useState(false);

  const handleClick = React.useCallback(() => {
    setExiting(true);
    // Call onFinish immediately when user clicks
    onFinish();
  }, [onFinish]);

  if (exiting) {
    return null;
  }

  return (
    <div
      data-testid="start-overlay"
      className="fixed inset-0 z-[9999] flex items-center justify-center text-white select-none cursor-pointer"
      style={{
        background:
          "radial-gradient(circle at center, rgba(0,0,0,0.95), #000000 80%)",
      }}
      onClick={handleClick}
    >
      <div className="text-center">
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