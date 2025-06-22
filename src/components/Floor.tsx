'use client'
// src/components/Floor.tsx
import React from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

// Static floor for physics bodies to land on
const Floor: React.FC = () => {
  return (
    <RigidBody type="fixed" colliders={false} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <CuboidCollider args={[25, 0.05, 25]} />
    </RigidBody>
  )
}

export default Floor
