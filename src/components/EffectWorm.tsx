'use client'
// src/components/EffectWorm.tsx
import React, { useRef } from 'react'
import { useSphere } from '@react-three/cannon'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

// Effect Worm: modifies nearby sound objects on collision
const EffectWorm: React.FC<{ id: string; position: [number, number, number] }> = ({ id, position }) => {
  const [ref] = useSphere(() => ({
    type: 'Kinematic',
    position,
    args: [0.3],
    isTrigger: true,
  }))

  // simple pulsating animation
  useFrame(({ clock }) => {
    if (ref.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2
      ref.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <mesh ref={ref as React.MutableRefObject<Mesh>}>
      <torusKnotGeometry args={[0.3, 0.1, 100, 16]} />
      <meshStandardMaterial color="#c084fc" metalness={0.5} roughness={0.5} transparent opacity={0.7} />
    </mesh>
  )
}

export default EffectWorm
