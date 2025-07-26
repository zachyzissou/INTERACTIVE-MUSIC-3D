'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js'

export interface BlobbyNoteProps {
  intensity: number
  color?: THREE.ColorRepresentation
  position?: [number, number, number]
}

export default function BlobbyNote({
  intensity,
  color = '#00bfff',
  position = [0, 0, 0]
}: BlobbyNoteProps) {
  // Material with emissive color
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.25,
      metalness: 0.7
    })
    m.emissive = new THREE.Color(color)
    return m
  }, [color])

  // Create MarchingCubes mesh
  const marching = useMemo(() => new MarchingCubes(24, material, true, true), [material])
  const ref = useRef<MarchingCubes>(marching)

  useFrame(({ clock }) => {
    const mc = ref.current
    const t = clock.getElapsedTime()
    mc.reset()

    const strength = 0.6 + intensity * 0.6
    const radius = 0.3 + intensity * 0.2

    for (let i = 0; i < 4; i++) {
      const x = 0.5 + 0.25 * Math.sin(t * 0.6 + i)
      const y = 0.5 + 0.25 * Math.cos(t * 0.4 + i * 1.7)
      const z = 0.5 + 0.25 * Math.sin(t * 0.8 + i * 2.3)
      mc.addBall(x, y, z, radius, strength)
    }

    ;(mc.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity
  })

  return <primitive ref={ref} object={marching} position={position} />
}
