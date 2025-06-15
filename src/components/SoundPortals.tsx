// src/components/SoundPortals.tsx
import React, { useState, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float, useCursor } from '@react-three/drei'
import { useObjects, ObjectType } from '../store/useObjects'
import type { Mesh, Group } from 'three'

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
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.5
  })
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
  const groupRef = useRef<Group>(null!)
  const { viewport } = useThree()
  useFrame(({ clock }) => { if (groupRef.current) groupRef.current.rotation.y = clock.getElapsedTime() * 0.2 })
  // dynamic ring radius based on viewport width
  const radius = Math.min(viewport.width / 2, 10)
  const height = 1.5
  const total = portalConfigs.length
  return (
    <group ref={groupRef}>
      {portalConfigs.map((cfg, idx) => {
        const angle = (idx / total) * Math.PI * 2
        const pos = [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number]
        return <Portal key={cfg.type} cfg={cfg} position={pos} />
      })}
    </group>
  )
}

export default SoundPortals
