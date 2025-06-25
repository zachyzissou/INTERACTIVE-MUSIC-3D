'use client'
// src/components/PortalRing.tsx
import React, { useRef, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import type { Mesh } from 'three'
import { usePortalRing } from './usePortalRing'
import { playNote } from '../lib/audio'
import { PORTAL_RADIUS } from '../config/constants'


// Portal definitions: assign a musical note and color to each
const portalConfigs: { note: string; color: string }[] = [
  { note: 'C4', color: '#4fa3ff' },
  { note: 'E4', color: '#6ee7b7' },
  { note: 'G4', color: '#a0aec0' },
  { note: 'B3', color: '#c084fc' },
  { note: 'D4', color: '#38bdf8' },
]

/**
 * Individual Portal mesh: sphere that floats, rotates, and plays a note on click.
 */
const Portal: React.FC<{
  note: string
  color: string
  position: [number, number, number]
  onClick: (note: string) => void
}> = ({ note, color, position, onClick }) => {
  const meshRef = useRef<Mesh>(null!)

  // rotate portal slowly
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.3
  })

  return (
    <Float position={position} speed={1} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={() => onClick(note)}
      >
        {/* Sphere radius = 2 scene units */}
        <sphereGeometry args={[PORTAL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
    </Float>
  )
}

/**
 * PortalRing component: arranges 5 portals in a responsive ring
 */
const PortalRing: React.FC = () => {
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)

  // debounce click interval
  const lastClick = useRef(0)
  const handlePortalClick = useCallback(
    async (note: string) => {
      const now = performance.now()
      if (now - lastClick.current < 50) return
      lastClick.current = now
      await playNote(note)
    },
    []
  )

  return (
    <group ref={groupRef}>
      {portalConfigs.map(({ note, color }, idx) => {
        return (
          <Portal
            key={note}
            note={note}
            color={color}
            position={getPosition(idx)}
            onClick={handlePortalClick}
          />
        )
      })}
    </group>
  )
}

export default PortalRing
