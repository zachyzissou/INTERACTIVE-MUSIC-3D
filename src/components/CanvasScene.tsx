'use client'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera, AdaptiveDpr, Stars, Float } from '@react-three/drei'
import { getGPUTier } from 'detect-gpu'
import { advancedRenderer } from '../lib/renderer'
import * as THREE from 'three'
import AnimatedGradient from './AnimatedGradient'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'
import XRButtons from './XRButtons'
import AudioReactiveOrb3D from './AudioReactiveOrb3D'
import AudioReactivePostProcess from './AudioReactivePostProcess'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { useAudioSettings } from '../store/useAudioSettings'

function ResizeHandler() {
  const { camera, gl } = useThree()
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      // Type guard for PerspectiveCamera
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = w / h
        camera.updateProjectionMatrix()
      }
      gl.setSize(w, h)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [camera, gl])
  return null
}

export default function CanvasScene() {
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const setPerf = usePerformanceSettings((s) => s.setLevel)
  const perfLevel = usePerformanceSettings((s) => s.level)
  const volume = useAudioSettings((s) => s.volume)
  
  React.useEffect(() => {
    let cancelled = false
    if (rendererRef.current) return
    
    ;(async () => {
      const gpu = await getGPUTier()
      if (gpu && gpu.tier < 1) setPerf('low')
      else if (gpu && gpu.tier < 3) setPerf('medium')
      
      if (!cancelled) {
        try {
          // Use the advanced renderer from lib/renderer.ts
          const canvas = document.createElement('canvas')
          const renderer = await advancedRenderer.initializeRenderer(canvas)
          rendererRef.current = renderer
        } catch (error) {
          console.warn('Advanced renderer initialization failed:', error)
        }
      }
    })()
    
    return () => {
      cancelled = true
    }
  }, [setPerf])

  return (
    <Canvas className="absolute inset-0" shadows gl={rendererRef.current ?? undefined}>
      <AdaptiveDpr pixelated />
      <AnimatedGradient />
      {perfLevel !== 'low' && <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />}
      <ResizeHandler />
      <Physics>
        <PerspectiveCamera makeDefault fov={50} position={[0,5,10]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5,10,5]} intensity={0.8} castShadow />
        <pointLight position={[0,5,-5]} intensity={0.5} />
        
        {/* Audio-reactive background elements */}
        {perfLevel !== 'low' && volume > 0 && (
          <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
            <AudioReactiveOrb3D 
              position={[-5, 3, -3]} 
              color="#ff006e" 
              frequency={0.2}
              intensity={volume}
            />
          </Float>
        )}
        
        {perfLevel === 'high' && volume > 0 && (
          <>
            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
              <AudioReactiveOrb3D 
                position={[5, -2, -2]} 
                color="#00d9ff" 
                frequency={0.8}
                intensity={volume * 0.7}
              />
            </Float>
            <Float speed={0.8} rotationIntensity={0.4} floatIntensity={0.6}>
              <AudioReactiveOrb3D 
                position={[0, 8, -5]} 
                color="#ffbe0b" 
                frequency={0.5}
                intensity={volume * 0.5}
              />
            </Float>
          </>
        )}
        
        <Suspense fallback={null}>
          <MusicalObject />
        </Suspense>
      </Physics>
      
      {/* Audio-reactive post-processing effects */}
      {perfLevel !== 'low' && volume > 0 && (
        <AudioReactivePostProcess 
          intensity={volume * 0.8}
          enableGlitch={perfLevel === 'high'}
          enableBloom={perfLevel === 'high'}
          enableChromatic={perfLevel === 'medium' || perfLevel === 'high'}
          performanceLevel={perfLevel}
        />
      )}
      
      <PlusButton3D />
      <XRButtons />
    </Canvas>
  )
}
