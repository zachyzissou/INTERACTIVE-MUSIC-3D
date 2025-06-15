// src/components/MusicalObject.tsx
import React, { useRef, useState, useMemo } from 'react'
import { Mesh } from 'three'
import { useSphere } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { playNote, playChord, playBeat } from '../lib/audio'
import { ObjectType } from '../store/useObjects'
import { objectConfigs } from '../lib/objectConfigs'

// Props interface for MusicalObject component
interface MusicalObjectProps {
  id: string
  type: ObjectType
  position: [number, number, number]
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
  const { raycaster, mouse, camera } = useThree()
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const intersectPoint = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    if (!dragging) return
    raycaster.setFromCamera(mouse, camera)
    raycaster.ray.intersectPlane(plane, intersectPoint)
    api.position.set(intersectPoint.x, intersectPoint.y, intersectPoint.z)
    api.velocity.set(0, 0, 0)
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
      <meshStandardMaterial
        color={objectConfigs[type].color}
        metalness={0.4}
        roughness={0.7}
      />
    </mesh>
  )
}

export default MusicalObject
