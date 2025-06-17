// src/components/SpawnMenu.tsx
import React, { useState } from 'react'
import { Float, useCursor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes, ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat, startLoop } from '../lib/audio'
import ShapeFactory from './ShapeFactory'
import ProceduralButton from './ProceduralButton'
import { motion } from 'framer-motion-3d'
const MMesh = motion.mesh as any
const MMaterial = motion.meshStandardMaterial as any

interface ItemProps { type: ObjectType; index: number }

const MenuItem: React.FC<ItemProps> = ({ type, index }) => {
  const spawn = useObjects((s) => s.spawn)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const [ripple, setRipple] = useState(false)
  useCursor(hovered)

  const handlePointerUp = () => {
    setActive(false)
    setRipple(true)
    setTimeout(() => setRipple(false), 300)
    const pos: [number, number, number] = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]
    const id = spawn(type, pos)
    if (type === 'note') playNote(id)
    else if (type === 'chord') playChord(id)
    else if (type === 'beat') playBeat(id)
    else startLoop(id)
  }

  const color = objectConfigs[type].color
  const pulse = objectConfigs[type].pulseIntensity ?? 0

  return (
    <Float position={[0, index * -1.2, 0]} floatIntensity={0.4} rotationIntensity={0}>
      <ProceduralButton
        color={color}
        pulse={pulse}
        hover={hovered}
        active={active}
        position={[0, 0, -0.3]}
      />
      <MMesh
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setActive(true)}
        onPointerUp={handlePointerUp}
        animate={{ scale: hovered || active ? 1.2 : 1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <ShapeFactory type={type} />
        <MMaterial
          color={active ? '#ffffff' : color}
          emissive={color}
          animate={{ emissiveIntensity: hovered || active ? 0.8 : 0.4 }}
          transition={{ duration: 0.2 }}
          metalness={0.5}
          roughness={0.5}
        />
      </MMesh>
      {ripple && (
        <MMesh
          key="ripple"
          rotation={[-Math.PI / 2, 0, 0]}
          initial={{ scale: 0.2, opacity: 0.6 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </MMesh>
      )}
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
