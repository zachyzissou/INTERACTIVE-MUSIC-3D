'use client'
// src/components/SpawnMenu.tsx
import React, { useState, useEffect } from 'react'
import { Float, useCursor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useObjects } from '../store/useObjects'
import { objectConfigs, objectTypes, ObjectType } from '../config/objectTypes'
import { playNote, playChord, playBeat, startLoop } from '../lib/audio'
import MusicIcon from './MusicIcon'
import ProceduralButton from './ProceduralButton'
import { useSpring, a } from '@react-spring/three'

interface ItemProps { type: ObjectType; index: number }

const Ripple: React.FC<{ color: string; onDone: () => void }> = ({ color, onDone }) => {
  const [springs, api] = useSpring(() => ({ scale: 0.2, opacity: 0.6 }))

  useEffect(() => {
    api.start({
      scale: 1.5,
      opacity: 0,
      config: { duration: 400 },
      onRest: onDone,
    })
  }, [api, onDone])

  return (
    <a.mesh rotation={[-Math.PI / 2, 0, 0]} scale={springs.scale}>
      <ringGeometry args={[0.6, 0.8, 32]} />
      <a.meshBasicMaterial
        color={color}
        transparent
        opacity={springs.opacity as unknown as number}
      />
    </a.mesh>
  )
}

const MenuItem: React.FC<ItemProps> = ({ type, index }) => {
  const spawn = useObjects((s) => s.spawn)
  const { camera } = useThree()
  const [hovered, setHovered] = useState(false)
  const [active, setActive] = useState(false)
  const [ripple, setRipple] = useState(false)
  useCursor(hovered)

  const { scale } = useSpring({
    scale: active ? 0.95 : hovered ? 1.2 : 1,
    config: { tension: 300, friction: 20 },
  })

  const handlePointerUp = () => {
    setActive(false)
    setRipple(true)
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
      <a.mesh
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={() => setActive(true)}
        onPointerUp={handlePointerUp}
        scale={scale}
      >
        <MusicIcon type={type} />
      </a.mesh>
      {ripple && (
        <Ripple color={color} onDone={() => setRipple(false)} />
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
