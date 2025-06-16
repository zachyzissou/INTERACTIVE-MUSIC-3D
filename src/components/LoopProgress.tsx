import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getLoopProgress, isLooping } from '../lib/audio'

const LoopProgress: React.FC<{ id: string }> = ({ id }) => {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (!ref.current) return
    if (!isLooping(id)) return
    const prog = getLoopProgress(id)
    const geom = ref.current.geometry as THREE.RingGeometry
    const newGeom = new THREE.RingGeometry(0.6, 0.7, 32, 1, 0, Math.PI * 2 * prog)
    ref.current.geometry.dispose()
    ref.current.geometry = newGeom
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.6, 0.7, 32, 1, 0, 0]} />
      <meshBasicMaterial color="white" transparent opacity={0.7} />
    </mesh>
  )
}

export default LoopProgress

