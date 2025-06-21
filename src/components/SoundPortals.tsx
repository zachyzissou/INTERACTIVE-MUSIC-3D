'use client'
// src/components/SoundPortals.tsx
import React, { useState } from 'react'
import { Float, useCursor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useObjects, ObjectType } from '../store/useObjects'
import { usePortalRing } from './usePortalRing'
import { objectConfigs, objectTypes } from '../config/objectTypes'
import ShapeFactory from './ShapeFactory'

const portalConfigs: { type: ObjectType; color: string }[] = objectTypes.map((t) => ({
  type: t,
  color: objectConfigs[t].color,
}))

const Portal: React.FC<{ cfg: typeof portalConfigs[0]; position: [number, number, number] }> = ({ cfg, position }) => {
  const spawn = useObjects((state) => state.spawn)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <Float position={position} floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
      <mesh
        castShadow
        receiveShadow
        scale={objectConfigs[cfg.type].baseScale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z]
          spawn(cfg.type, pos)
        }}
      >
        <ShapeFactory type={cfg.type} />
        <meshStandardMaterial
          color={cfg.color}
          metalness={0.5}
          roughness={0.4}
          emissive={cfg.color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  )
}

const SoundPortals: React.FC = () => {
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)
  return (
    <group ref={groupRef}>
      {portalConfigs.map((cfg, idx) => (
        <Portal key={cfg.type} cfg={cfg} position={getPosition(idx)} />
      ))}
    </group>
  )
}

export default SoundPortals
