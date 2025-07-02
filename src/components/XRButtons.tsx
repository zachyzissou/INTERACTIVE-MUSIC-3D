'use client'
import { ARButton as ARB, VRButton as VRB } from '@react-three/xr';
import React from 'react';

export default function XRButtons() {
  const ARButton = ARB as unknown as React.FC<any>;
  const VRButton = VRB as unknown as React.FC<any>;
  return (
    <div className="absolute top-2 right-2 z-10 flex gap-2">
      <ARButton />
      <VRButton />
    </div>
  );
}
