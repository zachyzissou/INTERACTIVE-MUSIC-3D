// src/components/SoundPortals.tsx
import React, { useState, useRef } from 'react'
import { Float, useCursor } from '@react-three/drei'
import { useObjects, ObjectType } from '../store/useObjects'
import type { Mesh } from 'three'
import { usePortalRing } from './usePortalRing'

// Define portal types with distinct colors
const portalConfigs: { type: ObjectType; color: string }[] = [
  { type: 'note', color: '#4fa3ff' },
  { type: 'chord', color: '#6ee7b7' },
  { type: 'beat', color: '#a0aec0' },
  { type: 'effect', color: '#c084fc' },
  { type: 'scaleCloud', color: '#38bdf8' },
]

// Individual Portal component with hover & rotation
const Portal: React.FC<{ cfg: typeof portalConfigs[0]; position: [number, number, number] }> = ({ cfg, position }) => {
  const spawn = useObjects((state) => state.spawn)
  const meshRef = useRef<Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <Float position={position} floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => spawn(cfg.type)}
      >
        {/* sphere radius 2 for diameter 4 units */}
        <sphereGeometry args={[2, 32, 32]} />
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

// SoundPortals arranged in a ring
const SoundPortals: React.FC = () => {
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)
  return (
    <group ref={groupRef}>
      {portalConfigs.map((cfg, idx) => {
        return <Portal key={cfg.type} cfg={cfg} position={getPosition(idx)} />
      })}
    </group>
  )
}

export default SoundPortals
