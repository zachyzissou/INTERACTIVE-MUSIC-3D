'use client'
// src/components/Floor.tsx
import React from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { FLOOR_COLLIDER, FLOOR_SIZE } from '../config/constants'

// Static floor for physics bodies to land on
const Floor: React.FC = () => {
  return (
    <RigidBody type="fixed" colliders={false} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow>
        <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <CuboidCollider args={FLOOR_COLLIDER} />
    </RigidBody>
  )
}

export default Floor
