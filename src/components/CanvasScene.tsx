'use client'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera, AdaptiveDpr, Stars, Float } from '@react-three/drei'
import { getGPUTier } from 'detect-gpu'
import { advancedRenderer } from '../lib/renderer'
import { webglSafeguards } from '../lib/webgl-safeguards'
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
  const [webglError, setWebglError] = React.useState<string | null>(null)
  const [isInitializing, setIsInitializing] = React.useState(true)
  const setPerf = usePerformanceSettings((s) => s.setLevel)
  const perfLevel = usePerformanceSettings((s) => s.level)
  const volume = useAudioSettings((s) => s.volume)
  const bassSensitivity = useShaderSettings((s) => s.bassSensitivity)
  
  React.useEffect(() => {
    let cancelled = false
    if (rendererRef.current) return
    
    const initializeGPU = async () => {
      try {
        setIsInitializing(true)
        setWebglError(null)

        // Check WebGL availability first
        const isAvailable = await webglSafeguards.isWebGLAvailable()
        if (!isAvailable) {
          throw new Error('WebGL is not supported on this device')
        }

        // Get performance tier from WebGL capabilities
        const tier = await webglSafeguards.getPerformanceTier()
        setPerf(tier)
        console.log(`Performance tier set to: ${tier}`)

        // Fallback to detect-gpu if needed
        try {
          const gpu = await getGPUTier()
          if (gpu && gpu.tier < 1) {
            setPerf('low')
          } else if (gpu && gpu.tier < 3) {
            setPerf('medium')
          }
        } catch (gpuError) {
          console.warn('GPU tier detection failed, using WebGL tier:', gpuError)
        }
        
        if (!cancelled) {
          try {
            // Use the advanced renderer with safeguards
            const canvas = document.createElement('canvas')
            
            // Create safe WebGL context
            const gl = await webglSafeguards.createSafeWebGLContext(canvas, {
              preferWebGL2: tier !== 'low',
              enableFallbacks: true,
              retryAttempts: 3,
              retryDelay: 1000,
              requireWebGL: true
            })

            if (!gl) {
              throw new Error('Failed to create WebGL context')
            }

            // Initialize renderer with the safe context
            const renderer = await advancedRenderer.initializeRenderer(canvas)
            rendererRef.current = renderer
            
            // Set up enhanced context loss/restore handlers
            const handleContextLost = (event: CustomEvent) => {
              contextLostRef.current = true
              setWebglError('WebGL context lost - attempting recovery...')
              console.warn('WebGL context lost, attempting recovery...')
            }
            
            const handleContextRestored = (event: CustomEvent) => {
              contextLostRef.current = false
              setWebglError(null)
              console.log('WebGL context restored successfully')
              
              // Reinitialize renderer after context restore
              setTimeout(async () => {
                try {
                  const newRenderer = await advancedRenderer.initializeRenderer(canvas)
                  rendererRef.current = newRenderer
                } catch (error) {
                  console.error('Failed to reinitialize renderer:', error)
                  setWebglError('Failed to recover WebGL context')
                }
              }, 100)
            }
            
            canvas.addEventListener('webgl-context-lost', handleContextLost as EventListener)
            canvas.addEventListener('webgl-context-restored', handleContextRestored as EventListener)
            
            setIsInitializing(false)
            console.log('WebGL initialization completed successfully')
            
          } catch (rendererError) {
            console.error('Renderer initialization failed:', rendererError)
            setWebglError(`Renderer initialization failed: ${rendererError.message}`)
            setIsInitializing(false)
          }
        }
        
      } catch (error) {
        console.error('GPU initialization failed:', error)
        setWebglError(`WebGL initialization failed: ${error.message}`)
        setIsInitializing(false)
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
    
    // Don't render if WebGL failed
    if (webglError && !isInitializing) {
      return null
    }
    
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
      // Enhanced canvas creation with error handling
      onCreated: ({ gl }: { gl: any; scene: any; camera: any }) => {
        // Immediate canvas setup for test compatibility
        gl.domElement.setAttribute('data-testid', 'webgl-canvas')
        
        // Set up additional WebGL error monitoring
        const canvas = gl.domElement
        const handleWebGLError = (event: Event) => {
          console.error('WebGL error detected:', event)
          setWebglError('WebGL rendering error detected')
        }
        
        canvas.addEventListener('webglcontextlost', handleWebGLError)
        
        // Log successful creation
        console.log('Canvas created and ready for rendering')
      },
    }
  }, [perfLevel, webglError, isInitializing]) // Add error state dependencies

  // Show error state if WebGL failed
  if (webglError && !isInitializing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-red-900/20 to-black">
        <div className="text-center p-8 bg-black/50 backdrop-blur-sm rounded-xl border border-red-500/30">
          <h3 className="text-red-400 text-xl font-bold mb-4">WebGL Error</h3>
          <p className="text-white/80 mb-6">{webglError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
          <p className="text-white/60 text-sm mt-4">
            This application requires WebGL support. Please update your browser or enable hardware acceleration.
          </p>
        </div>
      </div>
    )
  }

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-white font-medium">Initializing WebGL...</p>
        </div>
      </div>
    )
  }

  if (!canvasProps) {
    return null
  }

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
