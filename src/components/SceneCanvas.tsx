'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import type { WebGLRendererParameters } from 'three'
import ProceduralShapes from './ProceduralShapes'
import AudioVisualizer from './AudioVisualizer'
import Floor from './Floor'
import MusicalObject from './MusicalObject'
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
import {
  FOV_MIN,
  FOV_MAX,
  PARTICLE_COUNT_HIGH,
  PARTICLE_COUNT_LOW,
} from '../config/constants'

function createRenderer({ canvas, ...props }: WebGLRendererParameters) {
  return new THREE.WebGLRenderer({ canvas, ...props })
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
  const particleCount = lowPower ? PARTICLE_COUNT_LOW : PARTICLE_COUNT_HIGH

  useEffect(() => {
    initPhysics()
    startNote()
    const timer = setTimeout(() => stopNote(), 2000)
    return () => clearTimeout(timer)
  }, [])

  const clamp = useCallback(
    (val: number, min: number, max: number) =>
      Math.min(max, Math.max(min, val)),
    []
  )

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      setFov((f) => clamp(f + e.deltaY * 0.05, FOV_MIN, FOV_MAX))
    },
    [clamp]
  )

  const pointers = useRef(new Map<number, PointerEvent>())
  const baseDist = useRef(0)

  const handlePointerDown = useCallback((e: PointerEvent) => {
    pointers.current.set(e.pointerId, e)
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      baseDist.current = Math.hypot(
        a.clientX - b.clientX,
        a.clientY - b.clientY
      )
    }
  }, [])

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, e)
      if (pointers.current.size === 2 && baseDist.current) {
        const [a, b] = Array.from(pointers.current.values())
        const dist = Math.hypot(
          a.clientX - b.clientX,
          a.clientY - b.clientY
        )
        const diff = baseDist.current - dist
        setFov((f) => clamp(f + diff * 0.1, FOV_MIN, FOV_MAX))
        baseDist.current = dist
      }
    },
    [clamp]
  )

  const handlePointerUp = useCallback((e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) baseDist.current = 0
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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
  }, [handleWheel, handlePointerDown, handlePointerMove, handlePointerUp])

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={createRenderer}
        shadows
        camera={{ position: [0, 5, 10], fov }}
      >
        <AdaptiveDpr pixelated />
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
          <ProceduralShapes />
        </Physics>
        <ParticleBurst count={particleCount} color="#ff66aa" />
        <BloomComposer enabled={!lowPower} />
        <HUD />
      </Canvas>
    </div>
  )
}

export default SceneCanvas
