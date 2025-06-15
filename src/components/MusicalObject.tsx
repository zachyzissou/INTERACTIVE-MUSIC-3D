// src/components/MusicalObject.tsx
import React, { useRef, useState } from 'react'
import { Mesh } from 'three'
import { useSphere } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { playNote, playChord, playBeat } from '../lib/audio'
import { ObjectType } from '../store/useObjects'

// Props interface for MusicalObject component
interface MusicalObjectProps {
  id: string
  type: ObjectType
  position: [number, number, number]
}

// Map colors for all musical object types
const colorMap: Record<ObjectType, string> = {
  note: '#4fa3ff',     // cool blue
  chord: '#6ee7b7',    // minty
  beat: '#a0aec0',     // grayish
  effect: '#ff9f1c',   // orange for effects
  scaleCloud: '#9d4edd', // purple for scale clouds
}

export const MusicalObject: React.FC<MusicalObjectProps> = ({ id, type, position }) => {
  // physics body
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5],
    linearDamping: 0.9,
    userData: { id, type },
    onCollide: () => {
      // play sound when colliding
      if (type === 'note') playNote()
      if (type === 'chord') playChord()
      if (type === 'beat') playBeat()
    }
  }))

  // dragging state
  const [dragging, setDragging] = useState(false)
  const { raycaster, mouse, camera, scene, gl } = useThree()
  const planeNormal = [0, 1, 0] // horizontal plane

  useFrame(() => {
    if (dragging) {
      // cast ray to ground plane at y=0
      raycaster.setFromCamera(mouse, camera)
      const plane = new THREE.Plane(new THREE.Vector3(...planeNormal), 0)
      const intersectPoint = new THREE.Vector3()
      raycaster.ray.intersectPlane(plane, intersectPoint)
      // smoothly move body toward pointer
      api.position.set(...intersectPoint.toArray())
      api.velocity.set(0, 0, 0)
    }
  })

  return (
    <mesh
      ref={ref as React.MutableRefObject<Mesh>}
      castShadow
      receiveShadow
      onPointerDown={(e) => { e.stopPropagation(); setDragging(true) }}
      onPointerUp={(e) => { e.stopPropagation(); setDragging(false) }}
      onPointerMissed={() => setDragging(false)}
    >
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color={colorMap[type]} metalness={0.4} roughness={0.7} />
    </mesh>
  )
}

export default MusicalObject
