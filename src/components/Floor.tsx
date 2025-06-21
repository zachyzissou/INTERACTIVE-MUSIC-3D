'use client'
// src/components/Floor.tsx
import React from 'react'
import { usePlane } from '@react-three/cannon'

// Static floor for physics bodies to land on
const Floor: React.FC = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#111" />
    </mesh>
  )
}

export default Floor
