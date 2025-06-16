import React, { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { animate, useMotionValue } from 'framer-motion'
import { ObjectType, objectConfigs } from '../config/objectTypes'
import { getObjectMeter } from '../lib/audio'
import * as Tone from 'tone'
import ShapeFactory from './ShapeFactory'

interface Props {
  id: string
  type: ObjectType
  onComplete: () => void
}

const SpawnPreview: React.FC<Props> = ({ id, type, onComplete }) => {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const matRef = useRef<THREE.MeshStandardMaterial>(null!)
  const scale = useMotionValue(0)
  const opacity = useMotionValue(1)
  const meterRef = useRef<Tone.Meter | null>(null)

  useEffect(() => {
    meterRef.current = getObjectMeter(id)
    const controls = animate(scale, 1, { duration: 0.3 })
    const fade = animate(opacity, 0, {
      duration: 0.5,
      delay: 0.3,
      onComplete,
    })
    return () => {
      controls.stop()
      fade.stop()
    }
  }, [id, onComplete, scale, opacity])

  useFrame(() => {
    const group = groupRef.current
    const mat = matRef.current
    if (!group || !mat) return
    const dir = new THREE.Vector3(0, 0, -2).applyQuaternion(camera.quaternion)
    group.position.copy(camera.position).add(dir)
    group.quaternion.copy(camera.quaternion)
    const baseScale = scale.get()
    const meter = meterRef.current
    let pulse = 1
    if (meter) {
      const raw = meter.getValue()
      const level = Array.isArray(raw) ? raw[0] : raw
      const intensity = objectConfigs[type].pulseIntensity || 0
      pulse = 1 + level * intensity
    }
    group.scale.setScalar(baseScale * pulse)
    mat.opacity = opacity.get()
    mat.transparent = true
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <ShapeFactory type={type} />
        <meshStandardMaterial ref={matRef} color={objectConfigs[type].color} />
      </mesh>
    </group>
  )
}

export default SpawnPreview
