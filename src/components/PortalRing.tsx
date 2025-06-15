// src/components/PortalRing.tsx
import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as Tone from 'tone'
import type { Mesh, Group } from 'three'

// Shared Synth instance, lazy-initialized after first user interaction
let synth: Tone.Synth | null = null
async function getSynth() {
  if (synth) return synth
  await Tone.start()
  synth = new Tone.Synth().toDestination()
  // configure oscillator & envelope per global rules
  synth.oscillator.type = 'sine'
  synth.envelope.attack = 0.05
  synth.envelope.release = 1
  return synth
}

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
        <sphereGeometry args={[2, 32, 32]} />
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
  const groupRef = useRef<Group>(null!)
  const { viewport } = useThree()

  // rotate entire ring slowly
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.1
    }
  })

  // compute ring radius: clamp between 6 and 10 units based on viewport width
  const ringRadius = Math.min(Math.max(viewport.width / 2, 6), 10)
  const height = 1.5
  const total = portalConfigs.length

  // debounce click interval
  let lastClick = 0
  const handlePortalClick = async (note: string) => {
    const now = performance.now()
    if (now - lastClick < 50) return
    lastClick = now
    const s = await getSynth()
    s.triggerAttackRelease(note, '1n', Tone.now())
  }

  return (
    <group ref={groupRef}>
      {portalConfigs.map(({ note, color }, idx) => {
        const angle = (idx / total) * Math.PI * 2
        const x = Math.cos(angle) * ringRadius
        const z = Math.sin(angle) * ringRadius
        return (
          <Portal
            key={note}
            note={note}
            color={color}
            position={[x, height, z]}
            onClick={handlePortalClick}
          />
        )
      })}
    </group>
  )
}

export default PortalRing
