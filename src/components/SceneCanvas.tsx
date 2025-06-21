'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import FloatingSphere from './FloatingSphere'
import AudioVisualizer from './AudioVisualizer'
import Floor from './Floor'
import MusicalObject from './MusicalObject'
import SoundPortals from './SoundPortals'
import SpawnMenu from './SpawnMenu'
import EffectWorm from './EffectWorm'
import LoopProgress from './LoopProgress'
import HUD from './HUD'
import ParticleBurst from './ParticleBurst'
import { startNote, stopNote } from '../lib/audio'
import { initPhysics } from '../lib/physics'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import type { BloomEffect } from 'postprocessing'
import { getFrequencyBands } from '../lib/analyser'
import { isLowPowerDevice } from '../lib/performance'

function CameraController({ fov }: { fov: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    persp.fov = fov
    persp.updateProjectionMatrix()
  }, [fov, camera])
  return null
}

const BloomComposer: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const bloomRef = useRef<BloomEffect>(null)
  useFrame(() => {
    if (!enabled || !bloomRef.current) return
    const { low } = getFrequencyBands()
    bloomRef.current.intensity = THREE.MathUtils.lerp(
      bloomRef.current.intensity,
      0.5 + low * 2,
      0.1
    )
  })
  if (!enabled) return null
  return (
    <EffectComposer>
      <Bloom ref={bloomRef} intensity={0.5} mipmapBlur />
    </EffectComposer>
  )
}

const SceneCanvas: React.FC = () => {
  const [fov, setFov] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const [lowPower] = useState<boolean>(isLowPowerDevice())
  const particleCount = lowPower ? 256 : 1024

  useEffect(() => {
    initPhysics()
    startNote()
    const timer = setTimeout(() => stopNote(), 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const clamp = (val: number, min: number, max: number) =>
      Math.min(max, Math.max(min, val))

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setFov((f) => clamp(f + e.deltaY * 0.05, 30, 100))
    }

    const pointers = new Map<number, PointerEvent>()
    let base = 0

    const handlePointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, e)
      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values())
        base = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, e)
      if (pointers.size === 2 && base) {
        const [a, b] = Array.from(pointers.values())
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
        const diff = base - dist
        setFov((f) => clamp(f + diff * 0.1, 30, 100))
        base = dist
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) base = 0
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('pointercancel', handlePointerUp)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov }}>
        <AdaptiveDpr pixelated>
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
          <LoopProgress />
          <EffectWorm id="worm" position={[0, 1, 0]} />
          <FloatingSphere />
          <SoundPortals />
          <SpawnMenu />
        </Physics>
        <ParticleBurst count={particleCount} color="#ff66aa" />
        <BloomComposer enabled={!lowPower} />
        <HUD />
        </AdaptiveDpr>
      </Canvas>
    </div>
  )
}

export default SceneCanvas
