'use client'
// src/components/SoundPortals.tsx
import React, { useState, useMemo } from 'react'
import { Float, useCursor, Detailed } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useObjects, ObjectType } from '../store/useObjects'
import { usePortalRing } from './usePortalRing'
import { objectConfigs, objectTypes } from '../config/objectTypes'
import ShapeFactory from './ShapeFactory'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import * as THREE from 'three'
import { usePerformance } from '../store/usePerformance'

const portalConfigs: { type: ObjectType; color: string }[] = objectTypes.map((t) => ({
  type: t,
  color: objectConfigs[t].color,
}))

const Portal: React.FC<{ cfg: typeof portalConfigs[0]; position: [number, number, number] }> = ({ cfg, position }) => {
  const spawn = useObjects((state) => state.spawn)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <Float position={position} floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
      <mesh
        castShadow
        receiveShadow
        scale={objectConfigs[cfg.type].baseScale}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => {
          const pos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z]
          spawn({ type: cfg.type, position: pos })
        }}
      >
        <ShapeFactory type={cfg.type} />
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

const SoundPortals: React.FC = () => {
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)
  const lod = usePerformance((s) => s.lod)

  const merged = useMemo(() => {
    const geoms = portalConfigs.map((cfg, idx) => {
      const g = new THREE.SphereGeometry(2, 8, 8)
      g.translate(...getPosition(idx))
      const color = new THREE.Color(cfg.color)
      const count = g.attributes.position.count
      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      return g
    })
    return BufferGeometryUtils.mergeGeometries(geoms)
  }, [getPosition])

  const portals = (
    <>
      {portalConfigs.map((cfg, idx) => (
        <Portal key={cfg.type} cfg={cfg} position={getPosition(idx)} />
      ))}
    </>
  )

  if (!lod) return <group ref={groupRef}>{portals}</group>

  return (
    <group ref={groupRef}>
      <Detailed distances={[8]}>
        <group>{portals}</group>
        <mesh geometry={merged} castShadow receiveShadow>
          <meshStandardMaterial vertexColors metalness={0.5} roughness={0.4} />
        </mesh>
      </Detailed>
    </group>
  )
}

export default SoundPortals
