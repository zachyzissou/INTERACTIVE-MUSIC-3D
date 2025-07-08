'use client'
import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function XRButtons() {
  const [isXRSupported, setIsXRSupported] = useState(false);

  useEffect(() => {
    // Check if XR is supported in this browser
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then(supported => {
        setIsXRSupported(supported);
      }).catch(() => {
        setIsXRSupported(false);
      });
    }
  }, []);

  // Only render XR buttons if supported and properly configured
  if (!isXRSupported) {
    return null;
  }

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      <button 
        className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
        onClick={() => {
          // XR functionality can be added later when properly configured
          if (process.env.NODE_ENV === 'development') {
            logger.info('XR feature coming soon!')
          }
        }}
      >
        VR
      </button>
      <button 
        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        onClick={() => {
          // XR functionality can be added later when properly configured
          if (process.env.NODE_ENV === 'development') {
            logger.info('AR feature coming soon!')
          }
        }}
      >
        AR
      </button>
    </div>
  );
}
