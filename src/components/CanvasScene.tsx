'use client'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera, AdaptiveDpr } from '@react-three/drei'
import { getGPUTier } from 'detect-gpu'
import WebGPURenderer from 'three/src/renderers/webgpu/WebGPURenderer.js'
import * as THREE from 'three'
import AnimatedGradient from './AnimatedGradient'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'
import XRButtons from './XRButtons'
import { usePerformanceSettings } from '../store/usePerformanceSettings'

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
  const [ready, setReady] = React.useState(false)
  const setPerf = usePerformanceSettings((s) => s.setLevel)
  
  React.useEffect(() => {
    let cancelled = false
    if (rendererRef.current) return
    
    ;(async () => {
      const gpu = await getGPUTier()
      if (gpu && gpu.tier < 1) setPerf('low')
      else if (gpu && gpu.tier < 3) setPerf('medium')
      
      // Type-safe WebGPU detection
      const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
      if (!cancelled && hasWebGPU) {
        try {
          // WebGPURenderer implements the same interface as WebGLRenderer for Three.js
          const webgpuRenderer = new WebGPURenderer({ antialias: true })
          // Type cast through unknown as WebGPU and WebGL renderers have compatible interfaces for Canvas
          rendererRef.current = webgpuRenderer as unknown as THREE.WebGLRenderer
          setReady(true)
        } catch (error) {
          console.warn('WebGPU renderer initialization failed:', error)
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
      <ResizeHandler />
      <Physics>
        <PerspectiveCamera makeDefault fov={50} position={[0,5,10]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5,10,5]} intensity={0.8} castShadow />
        <pointLight position={[0,5,-5]} intensity={0.5} />
        <Suspense fallback={null}>
          <MusicalObject />
        </Suspense>
      </Physics>
      <PlusButton3D />
      <XRButtons />
    </Canvas>
  )
}
