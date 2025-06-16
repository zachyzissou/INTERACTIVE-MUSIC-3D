// src/components/SpawnMenu.tsx
import React, { useState } from 'react'
import { Float, useCursor } from '@react-three/drei'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes, ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat } from '../lib/audio'
import ShapeFactory from './ShapeFactory'

interface ItemProps { type: ObjectType; index: number }

const MenuItem: React.FC<ItemProps> = ({ type, index }) => {
  const spawn = useObjects((s) => s.spawn)
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  useCursor(hovered)

  const handlePointerUp = () => {
    setActive(false)
    const id = spawn(type)
    if (type === 'note') playNote(id)
    else if (type === 'chord') playChord(id)
    else playBeat(id)
  }

  const color = objectConfigs[type].color

  return (
    <Float position={[0, index * -1.2, 0]} floatIntensity={0.4} rotationIntensity={0}>
      <mesh
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setActive(true)}
        onPointerUp={handlePointerUp}
      >
        <ShapeFactory type={type} />
        <meshStandardMaterial
          color={active ? '#ffffff' : color}
          emissive={hovered || active ? color : '#000000'}
          emissiveIntensity={hovered || active ? 0.6 : 0}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
    </Float>
  )
}

const SpawnMenu: React.FC = () => {
  return (
    <group position={[-4, 2.5, 0]}>
      {objectTypes.map((t, idx) => (
        <MenuItem key={t} type={t} index={idx} />
      ))}
    </group>
  )
}

export default SpawnMenu
