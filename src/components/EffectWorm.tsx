'use client'
// src/components/EffectWorm.tsx
import React, { useRef } from 'react'
import { RigidBody, BallCollider } from '@react-three/rapier'
import { Mesh } from 'three'
import { useFrame } from '@react-three/fiber'

// Effect Worm: modifies nearby sound objects on collision
const EffectWorm: React.FC<{ id: string; position: [number, number, number] }> = ({ id, position }) => {
  const meshRef = useRef<Mesh>(null)

  // simple pulsating animation
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.2
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <RigidBody type="kinematicPosition" colliders={false} position={position}>
      <mesh ref={meshRef as React.MutableRefObject<Mesh>}>
        <torusKnotGeometry args={[0.3, 0.1, 100, 16]} />
        <meshStandardMaterial color="#c084fc" metalness={0.5} roughness={0.5} transparent opacity={0.7} />
      </mesh>
      <BallCollider args={[0.3]} sensor />
    </RigidBody>
  )
}

export default EffectWorm
