// src/components/MusicalObject.tsx
import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Mesh } from 'three'
import { useSphere } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import * as Tone from 'tone'
import { playNote, playChord, playBeat, getObjectMeter } from '../lib/audio'
import { ObjectType } from '../store/useObjects'
import { objectConfigs } from '../config/objectTypes'
import ShapeFactory from './ShapeFactory'
import { Html } from '@react-three/drei'
import { useEffectSettings } from '../store/useEffectSettings'
import EffectPanel from './EffectPanel'

// Props interface for MusicalObject component
interface MusicalObjectProps {
  id: string
  type: ObjectType
  position: [number, number, number]
}


export const SingleMusicalObject: React.FC<MusicalObjectProps> = ({ id, type, position }) => {
  // physics body
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5],
    linearDamping: 0.9,
    userData: { id, type },
    onCollide: () => {
      // play sound when colliding
      if (type === 'note') playNote(id)
      if (type === 'chord') playChord(id)
      if (type === 'beat' || type === 'loop') playBeat(id)
    }
  }))

  // dragging state
  const [dragging, setDragging] = useState(false)
  const [moved, setMoved] = useState(false)
  const select = useEffectSettings((s) => s.select)
  const selected = useEffectSettings((s) => s.selected)
  const { raycaster, mouse, camera } = useThree()
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const intersectPoint = useMemo(() => new THREE.Vector3(), [])

  const meterRef = useRef<Tone.Meter | null>(null)

  useEffect(() => {
    meterRef.current = getObjectMeter(id)
  }, [id])

  useFrame(() => {
    if (!dragging) return
    raycaster.setFromCamera(mouse, camera)
    raycaster.ray.intersectPlane(plane, intersectPoint)
    api.position.set(intersectPoint.x, intersectPoint.y, intersectPoint.z)
    api.velocity.set(0, 0, 0)
    setMoved(true)
  })

  useFrame(() => {
    const meter = meterRef.current
    const mesh = ref.current as unknown as THREE.Mesh
    if (!meter || !mesh) return
    const raw = meter.getValue()
    const level = Array.isArray(raw) ? raw[0] : raw
    const intensity = objectConfigs[type].pulseIntensity || 0
    const target = 1 + level * intensity
    mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, target, 0.2))
  })

  return (
    <mesh
      ref={ref as React.MutableRefObject<Mesh>}
      castShadow
      receiveShadow
      onPointerDown={(e) => { e.stopPropagation(); setDragging(true); setMoved(false) }}
      onPointerUp={(e) => { e.stopPropagation(); setDragging(false) }}
      onClick={(e) => { e.stopPropagation(); if (!moved) select(id) }}
      onPointerMissed={() => setDragging(false)}
    >
      <ShapeFactory type={type} />
      <meshStandardMaterial
        color={objectConfigs[type].color}
        metalness={0.4}
        roughness={0.7}
      />
      {selected === id && (
        <Html position={[0, 1, 0]} transform>
          <EffectPanel objectId={id} />
        </Html>
      )}
    </mesh>
  )
}

export default SingleMusicalObject
