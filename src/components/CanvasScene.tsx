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
import PostProcessErrorBoundary from './PostProcessErrorBoundary'
import AudioReactiveShaderBackground from './AudioReactiveShaderBackground'
import SceneLights from './SceneLights'
import { usePerformanceSettings } from '../store/usePerformanceSettings'
import { useAudioSettings } from '../store/useAudioSettings'
import { useShaderSettings } from '../store/useShaderSettings'

function ResizeHandler() {
  const { camera, gl, viewport } = useThree()
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      
      // Ensure minimum dimensions and handle edge cases
      const minWidth = Math.max(w, 320)
      const minHeight = Math.max(h, 240)
      
      // Update camera aspect ratio
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = minWidth / minHeight
        camera.updateProjectionMatrix()
      }
      
      // Force renderer size update
      gl.setSize(minWidth, minHeight, true)
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      
      // Ensure canvas element has proper size
      const canvas = gl.domElement
      if (canvas) {
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.display = 'block'
      }
    }
    
    // Delay initial resize to ensure DOM is ready
    const timeoutId = setTimeout(onResize, 100)
    
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', onResize)
    }
  }, [camera, gl, viewport])
  return null
}

export default function CanvasScene() {
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null)
  const contextLostRef = React.useRef(false)
  const setPerf = usePerformanceSettings((s) => s.setLevel)
  const perfLevel = usePerformanceSettings((s) => s.level)
  const volume = useAudioSettings((s) => s.volume)
  const bassSensitivity = useShaderSettings((s) => s.bassSensitivity)
  
  React.useEffect(() => {
    let cancelled = false
    if (rendererRef.current) return
    
    const initializeGPU = async () => {
      const gpu = await getGPUTier()
      if (gpu && gpu.tier < 1) {
        setPerf('low')
      } else if (gpu && gpu.tier < 3) {
        setPerf('medium')
      }
      
      if (!cancelled) {
        try {
          // Use the advanced renderer from lib/renderer.ts
          const canvas = document.createElement('canvas')
          const renderer = await advancedRenderer.initializeRenderer(canvas)
          rendererRef.current = renderer
          
          // Set up WebGL context loss/restore handlers
          const contextLossHandler = (event: Event) => {
            event.preventDefault()
            contextLostRef.current = true
            console.warn('WebGL context lost, attempting recovery...')
          }
          
          const contextRestoreHandler = () => {
            contextLostRef.current = false
            console.warn('WebGL context restored')
          }
          
          canvas.addEventListener('webglcontextlost', contextLossHandler, false)
          canvas.addEventListener('webglcontextrestored', contextRestoreHandler, false)
          
        } catch (error) {
          console.warn('Advanced renderer initialization failed:', error)
        }
      }
    }
    
    initializeGPU()
    
    return () => {
      cancelled = true
    }
  }, [setPerf])

  const canvasProps = React.useMemo(() => {
    // Enhanced Safari compatibility
    const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    const isWebKit = typeof navigator !== 'undefined' && /webkit/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent)
    
    return {
      className: "absolute inset-0",
      shadows: !contextLostRef.current && !isSafari, // Disable shadows on Safari for compatibility
      gl: rendererRef.current ?? {
        antialias: perfLevel !== 'low' && !isSafari, // Conservative antialias for Safari
        alpha: true,
        powerPreference: (perfLevel === 'high' && !isWebKit) ? 'high-performance' as const : 'default' as const,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: isSafari, // Safari sometimes needs this
        stencil: false,
        depth: true,
        // Safari-specific WebGL context attributes
        ...(isSafari && {
          premultipliedAlpha: false,
          desynchronized: false,
        }),
      },
      camera: { fov: 50, position: [0, 5, 10] as [number, number, number] },
      style: { width: '100vw', height: '100vh' },
      resize: { scroll: false, debounce: { scroll: 0, resize: 0 } },
      dpr: Math.min(window.devicePixelRatio || 1, (perfLevel === 'high' && !isWebKit) ? 2 : 1),
      performance: {
        min: 0.5,
        max: (perfLevel === 'high' && !isSafari) ? 1 : 0.8,
        debounce: 200,
      },
      frameloop: contextLostRef.current ? 'never' as const : 'always' as const,
      // Force canvas creation without waiting for async initialization
      onCreated: ({ gl }: { gl: any; scene: any; camera: any }) => {
        // Immediate canvas setup for test compatibility
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
        // Canvas created and ready for testing
      },
    }
  }, [perfLevel]) // Remove contextLostRef.current dependency as it's a mutable ref

  return (
    <Canvas {...canvasProps}>
      <AdaptiveDpr pixelated />
      
      {/* Audio-reactive shader backgrounds */}
      {perfLevel !== 'low' && (
        <>
          <AudioReactiveShaderBackground
            activeShader="metaball"
            position={[0, 0, -15]}
            scale={[25, 25, 1]}
            bassLevel={0.5}
            midLevel={0.3}
            highLevel={0.2}
            glitchIntensity={0}
            enabled={true}
            audioSensitivity={{ bass: bassSensitivity, mid: 1, high: 1 }}
          />
          {perfLevel === 'high' && (
            <>
              <AudioReactiveShaderBackground 
                activeShader="voronoi" 
                position={[-10, 5, -12]} 
                scale={[15, 15, 1]} 
                bassLevel={0.5}
                midLevel={0.3}
                highLevel={0.2}
                glitchIntensity={0}
                enabled={true}
                audioSensitivity={{ bass: bassSensitivity, mid: 1, high: 1 }}
              />
              <AudioReactiveShaderBackground
                activeShader="water"
                position={[10, -5, -12]}
                scale={[15, 15, 1]}
                bassLevel={0.5}
                midLevel={0.3}
                highLevel={0.2}
                glitchIntensity={0}
                enabled={true}
                audioSensitivity={{ bass: bassSensitivity, mid: 1, high: 1 }}
              />
            </>
          )}
        </>
      )}
      
      <AnimatedGradient />
      {perfLevel !== 'low' && <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade />}
      <ResizeHandler />
      <Physics>
        <PerspectiveCamera makeDefault fov={50} position={[0,5,10]} />
        <SceneLights />
        
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
      
      <PlusButton3D />
      <XRButtons />
      
      {/* Post-processing effects - temporarily disabled to fix 3D scene visibility */}
      {false && perfLevel !== 'low' && (
        <PostProcessErrorBoundary>
          <AudioReactivePostProcess 
            intensity={volume}
            enableGlitch={perfLevel === 'high'}
            enableBloom={true}
            enableChromatic={perfLevel === 'high'}
            performanceLevel={perfLevel}
          />
        </PostProcessErrorBoundary>
      )}
    </Canvas>
  )
}
