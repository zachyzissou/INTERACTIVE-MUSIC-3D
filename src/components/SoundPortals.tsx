// src/components/SoundPortals.tsx
import React, { useState } from 'react'
import { Float, useCursor, Instances, Instance } from '@react-three/drei'
import { useObjects, ObjectType } from '../store/useObjects'
import { usePortalRing } from './usePortalRing'
import { objectConfigs, objectTypes } from '../config/objectTypes'
import { usePerformance } from '../store/usePerformance'

const portalConfigs: { type: ObjectType; color: string }[] = objectTypes.map((t) => ({
  type: t,
  color: objectConfigs[t].color,
}))

const SoundPortalsInstanced: React.FC = () => {
  const spawn = useObjects((state) => state.spawn)
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)
  const [hovered, setHovered] = useState<string | null>(null)
  useCursor(!!hovered)
  return (
    <group ref={groupRef}>
      <Float floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
        <Instances limit={portalConfigs.length} castShadow receiveShadow>
          <sphereGeometry args={[2, 32, 32]} />
          <meshStandardMaterial vertexColors />
          {portalConfigs.map((cfg, idx) => (
            <Instance
              key={cfg.type}
              color={cfg.color}
              position={getPosition(idx)}
              onPointerOver={() => setHovered(cfg.type)}
              onPointerOut={() => setHovered(null)}
              onClick={() => spawn(cfg.type)}
            />
          ))}
        </Instances>
      </Float>
    </group>
  )
}

const Portal: React.FC<{ cfg: typeof portalConfigs[0]; position: [number, number, number] }> = ({ cfg, position }) => {
  const spawn = useObjects((state) => state.spawn)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  return (
    <Float position={position} floatIntensity={1} speed={1.5} rotationIntensity={0.5}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => spawn(cfg.type)}
      >
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

const SoundPortals: React.FC = () => {
  const { groupRef, getPosition } = usePortalRing(portalConfigs.length)
  const instanced = usePerformance((s) => s.instanced)
  if (!instanced) {
    return (
      <group ref={groupRef}>
        {portalConfigs.map((cfg, idx) => (
          <Portal key={cfg.type} cfg={cfg} position={getPosition(idx)} />
        ))}
      </group>
    )
  }
  return <SoundPortalsInstanced />
}

export default SoundPortals
