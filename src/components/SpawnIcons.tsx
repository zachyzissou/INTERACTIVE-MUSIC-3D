import React, { useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCursor } from '@react-three/drei'
import { motion } from 'framer-motion-3d'
import { objectTypes, objectConfigs, ObjectType } from '../config/objectTypes'
import ShapeFactory from './ShapeFactory'
import { useObjects } from '../store/useObjects'
import { playNote, playChord, playBeat, startLoop } from '../lib/audio'

interface Preview { id: string; type: ObjectType }

const SpawnPreview: React.FC<Preview & { onDone: (id: string) => void }> = ({ id, type, onDone }) => {
  const ref = React.useRef<THREE.Mesh>(null!)
  const { camera } = useThree()
  useFrame(() => {
    if (!ref.current) return
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const pos = camera.position.clone().add(dir.multiplyScalar(2))
    ref.current.position.copy(pos)
    ref.current.quaternion.copy(camera.quaternion)
  })
  React.useEffect(() => {
    const t = setTimeout(() => onDone(id), 700)
    return () => clearTimeout(t)
  }, [id, onDone])
  return (
    <motion.mesh ref={ref} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 150 }}>
      <ShapeFactory type={type} />
      <meshStandardMaterial color={objectConfigs[type].color} emissive={objectConfigs[type].color} />
    </motion.mesh>
  )
}

const Icon: React.FC<{ type: ObjectType; position: [number, number, number]; onSpawn: (type: ObjectType) => void }> = ({ type, position, onSpawn }) => {
  const [hovered, setHovered] = useState(false)
  useCursor(hovered)
  const cfg = objectConfigs[type]
  return (
    <motion.mesh
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onSpawn(type)}
      animate={{ scale: hovered ? 1.2 : 1 }}
    >
      <ShapeFactory type={type} />
      <meshStandardMaterial color={cfg.color} emissive={hovered ? cfg.color : 'black'} emissiveIntensity={hovered ? 0.6 : 0.2} />
    </motion.mesh>
  )
}

const SpawnIcons: React.FC = () => {
  const spawn = useObjects((s) => s.spawn)
  const { viewport } = useThree()
  const [previews, setPreviews] = useState<Preview[]>([])

  const handleSpawn = (type: ObjectType) => {
    const id = spawn(type)
    if (type === 'note') playNote(id)
    else if (type === 'chord') playChord(id)
    else if (type === 'beat') playBeat(id)
    else {
      playBeat(id)
      startLoop(id)
    }
    setPreviews((p) => [...p, { id, type }])
  }

  return (
    <group position={[-viewport.width / 2 + 1.5, 0, 0]}>
      {objectTypes.map((t, i) => (
        <Icon key={t} type={t} position={[0, 2 - i * 1.5, 0]} onSpawn={handleSpawn} />
      ))}
      {previews.map((p) => (
        <SpawnPreview key={p.id} {...p} onDone={(id) => setPreviews((arr) => arr.filter((a) => a.id !== id))} />
      ))}
    </group>
  )
}

export default SpawnIcons

