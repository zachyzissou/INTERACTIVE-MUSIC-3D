'use client'
import React, { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import * as THREE from 'three'
import FloatingSphere from './FloatingSphere'
import AudioVisualizer from './AudioVisualizer'
import Floor from './Floor'
import MusicalObject from './MusicalObject'
import SoundPortals from './SoundPortals'
import SpawnMenu from './SpawnMenu'
import SpawnPreviewList from './SpawnPreviewList'
import EffectWorm from './EffectWorm'
import { startNote, stopNote } from '../lib/audio'
import { initPhysics } from '../lib/physics'

interface Props {
  fov: number
}

function CameraController({ fov }: { fov: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    persp.fov = fov
    persp.updateProjectionMatrix()
  }, [fov, camera])
  return null
}

const SceneCanvas: React.FC<Props> = ({ fov }) => {
  useEffect(() => {
    initPhysics()
    startNote()
    const timer = setTimeout(() => stopNote(), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov }}>
      <Physics>
        <CameraController fov={fov} />
        <ambientLight intensity={0.3} />
        <directionalLight
          castShadow
          position={[5, 10, 5]}
          intensity={0.8}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <AudioVisualizer />
        <Floor />
        <MusicalObject />
        <EffectWorm id="worm" position={[0, 1, 0]} />
        <FloatingSphere />
        <SoundPortals />
        <SpawnMenu />
      </Physics>
      <SpawnPreviewList />
    </Canvas>
  )
}

export default SceneCanvas
