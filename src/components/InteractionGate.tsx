"use client";
import React from "react";

interface InteractionGateProps {
  started: boolean;
  onStart: () => void;
  children: React.ReactNode;
}

/**
 * Generic overlay to defer interactive features until the user clicks.
 * Prevents hydration mismatch by ensuring audio and WebGL start client-side.
 */
export default function InteractionGate({ started, onStart, children }: InteractionGateProps) {
  if (!started) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white cursor-pointer"
        onClick={onStart}
      >
        Tap to start
      </div>
    );
  }
  return <>{children}</>;
}
