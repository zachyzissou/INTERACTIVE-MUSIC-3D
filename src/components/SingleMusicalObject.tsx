'use client'
// src/components/MusicalObject.tsx
import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react'
import { Object3D } from 'three'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useFrame, useThree } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'
import { getObjectMeter, getObjectPanner } from '../lib/audio'
import type { Meter } from 'tone'
import { triggerSound } from '../lib/soundTriggers'
import { ObjectType } from '../store/useObjects'
import { objectConfigs } from '../config/objectTypes'
import ProceduralShape from './ProceduralShape'
import { useSelectedShape } from '../store/useSelectedShape'

// Props interface for MusicalObject component
interface MusicalObjectProps {
  readonly id: string
  readonly type: ObjectType
  readonly position: readonly [number, number, number]
  readonly children?: React.ReactNode
}


export const SingleMusicalObject: React.FC<MusicalObjectProps> = ({ id, type, position, children }) => {
  // physics body using Rapier
  const bodyRef = useRef<RapierRigidBody | null>(null)
  const meshRef = useRef<Object3D>(null)

  // dragging state
  const [dragging, setDragging] = useState(false)
  const [moved, setMoved] = useState(false)
  const select = useSelectedShape((s) => s.selectShape)
  const selected = useSelectedShape((s) => s.selected)
  const { raycaster, mouse, camera } = useThree()
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const intersectPoint = useMemo(() => new THREE.Vector3(), [])

  const meterRef = useRef<Meter | null>(null)
  const pannerRef = useRef<PannerNode | null>(null)

  useFrame(() => {
    if (!dragging || !bodyRef.current) return
    raycaster.setFromCamera(mouse, camera)
    raycaster.ray.intersectPlane(plane, intersectPoint)
    bodyRef.current.setTranslation(
      { x: intersectPoint.x, y: intersectPoint.y, z: intersectPoint.z },
      true
    )
    bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
    setMoved(true)
  })

  useFrame(() => {
    const meter = meterRef.current
    const panner = pannerRef.current
    const mesh = meshRef.current as unknown as THREE.Mesh
    if (!mesh) return
    if (panner) {
      const pos = mesh.getWorldPosition(new THREE.Vector3())
      panner.positionX.value = pos.x
      panner.positionY.value = pos.y
      panner.positionZ.value = pos.z
    }
    if (meter) {
      const raw = meter.getValue()
      const level = Array.isArray(raw) ? raw[0] : raw
      const cfg = objectConfigs[type]
      const intensity = cfg.pulseIntensity || 0
      const target = cfg.baseScale * (1 + level * intensity)
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, target, 0.2))
      const mat = mesh.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.2 + level * 0.8, 0.2)
    }
  })

  const [springs, springApi] = useSpring(() => ({ scale: 0 }))

  useEffect(() => {
    springApi.start({ scale: 1, from: { scale: 0 }, config: { tension: 160, friction: 20 } })
  }, [springApi])

  const onPointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setDragging(true)
    setMoved(false)
  }, [])

  const onPointerUp = useCallback((e: any) => {
    e.stopPropagation()
    setDragging(false)
  }, [])

  const onClick = useCallback(
    async (e: any) => {
      e.stopPropagation()
      if (!moved) select(id)
      await triggerSound(type, id)
      meterRef.current = getObjectMeter(id)
      pannerRef.current = getObjectPanner(id)
    },
    [moved, select, id, type]
  )

  const onMiss = useCallback(() => setDragging(false), [])

  const AnimatedGroup: any = (animated as any).group

  return (
    <RigidBody
      ref={bodyRef}
      colliders="ball"
      linearDamping={0.9}
      mass={1}
      position={position}
      onCollisionEnter={async () => {
        await triggerSound(type, id)
        meterRef.current = getObjectMeter(id)
        pannerRef.current = getObjectPanner(id)
      }}
    >
      <AnimatedGroup
        ref={meshRef as React.MutableRefObject<Object3D>}
        scale={springs.scale.to((s) => s * objectConfigs[type].baseScale)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onPointerMissed={onMiss}
      >
        <ProceduralShape type={type} />
        {children}
      </AnimatedGroup>
    </RigidBody>
  )
}

export default SingleMusicalObject
