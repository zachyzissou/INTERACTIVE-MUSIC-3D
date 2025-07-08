'use client'
import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { gsap } from 'gsap'

// Core components
import WebGPURenderer from '@/components/WebGPURenderer'
import AudioReactiveShaderBackground from '@/components/AudioReactiveShaderBackground'
import ProceduralShapes from '@/components/ProceduralShapes'
import SceneLights from '@/components/SceneLights'
import ParticleBurst from '@/components/ParticleBurst'
import FloatingSphere from '@/components/FloatingSphere'

// Audio reactive components
import { useAudioStore } from '@/store/useAudioStore'
import { useShaderStore } from '@/store/shaderStore'

interface CanvasSceneProps {
  enableWebGPU?: boolean
  enablePostProcessing?: boolean
  adaptiveQuality?: boolean
  className?: string
}

function SceneContent() {
  const meshRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  
  // Audio reactive state
  const audioStore = useAudioStore()
  const { 
    bassData, 
    midData, 
    highData, 
    frequencyData, 
    isAnalyzing 
  } = {
    bassData: audioStore.analysisData?.bassEnergy || 0,
    midData: audioStore.analysisData?.midEnergy || 0,
    highData: audioStore.analysisData?.trebleEnergy || 0,
    frequencyData: audioStore.analysisData?.frequencyData || new Uint8Array(0),
    isAnalyzing: audioStore.isPlaying
  }
  
  // Shader state
  const { 
    activeShader, 
    glitchIntensity, 
    audioReactivity,
    shaderUniforms 
  } = useShaderStore()

  useEffect(() => {
    // Scene entrance animation
    if (meshRef.current && !isReady) {
      gsap.fromTo(meshRef.current.scale,
        { x: 0, y: 0, z: 0 },
        { 
          x: 1, 
          y: 1, 
          z: 1, 
          duration: 2, 
          ease: 'back.out(1.4)',
          onComplete: () => setIsReady(true)
        }
      )
    }
  }, [isReady])

  return (
    <>
      {/* Camera Setup */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, 0, 10]} 
        fov={75}
        near={0.1}
        far={1000}
      />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />

      {/* Environment */}
      <Environment preset="night" />
      
      {/* Lighting */}
      <SceneLights />

      {/* Audio-Reactive Background Shader */}
      {/* <AudioReactiveShaderBackground
        activeShader={activeShader}
        audioData={{
          bass: bassData,
          mid: midData, 
          high: highData,
          frequency: frequencyData
        }}
        uniforms={shaderUniforms}
        intensity={audioReactivity}
      /> */}

      {/* Main 3D Content */}
      <group ref={meshRef}>
        {/* Procedural Shapes */}
        {/* <ProceduralShapes
          audioData={{
            bass: bassData,
            mid: midData,
            high: highData
          }}
          isAnalyzing={isAnalyzing}
        /> */}

        {/* Floating Interactive Spheres */}
        {/* <FloatingSphere
          position={[-3, 2, 0]}
          color={[1, 0.2, 0.8]}
          audioReactivity={bassData}
          scale={0.8 + bassData * 0.5}
        />
        
        <FloatingSphere
          position={[3, -1, 0]}
          color={[0.2, 0.8, 1]}
          audioReactivity={midData}
          scale={0.6 + midData * 0.4}
        />
        
        <FloatingSphere
          position={[0, 3, -2]}
          color={[0.8, 1, 0.2]}
          audioReactivity={highData}
          scale={0.7 + highData * 0.3}
        /> */}

        {/* Basic 3D mesh for demonstration */}
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        {/* Particle Systems */}
        {/* <ParticleBurst
          trigger={bassData > 0.7}
          intensity={bassData}
          position={[0, 0, 0]}
        /> */}
      </group>

      {/* Post-Processing Effects */}
      <EffectComposer>
        <Bloom
          intensity={0.5 + bassData * 0.5}
          kernelSize={3}
          luminanceThreshold={0.7}
          luminanceSmoothing={0.4}
          blendFunction={BlendFunction.ADD}
        />
        
        <Noise
          opacity={0.1 + glitchIntensity * 0.2}
          blendFunction={BlendFunction.MULTIPLY}
        />
        
        <Vignette
          offset={0.3}
          darkness={0.5 + midData * 0.3}
          blendFunction={BlendFunction.MULTIPLY}
        />
      </EffectComposer>

      {/* Adaptive Quality */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-white/80">
          Loading 3D Scene...
        </div>
        <div className="text-white/60 text-sm">
          Initializing WebGPU shaders and audio reactivity
        </div>
      </div>
    </div>
  )
}

export default function CanvasScene({ 
  enableWebGPU = true,
  enablePostProcessing = true,
  adaptiveQuality = true,
  className = ''
}: CanvasSceneProps) {
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('high')
  
  useEffect(() => {
    // Detect performance capabilities
    const detectPerformance = () => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      
      if (!gl) {
        setPerformanceLevel('low')
        return
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : ''
      
      // Basic performance heuristics
      if (renderer.includes('Intel') || renderer.includes('ARM')) {
        setPerformanceLevel('medium')
      } else if (renderer.includes('NVIDIA') || renderer.includes('AMD') || renderer.includes('Radeon')) {
        setPerformanceLevel('high')
      } else {
        setPerformanceLevel('medium')
      }
    }
    
    detectPerformance()
  }, [])

  const canvasProps = {
    shadows: performanceLevel !== 'low',
    antialias: performanceLevel === 'high',
    alpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance' as const,
    failIfMajorPerformanceCaveat: false,
    dpr: adaptiveQuality ? undefined : (performanceLevel === 'high' ? 2 : 1)
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {enableWebGPU ? (
        <WebGPURenderer 
          enableWebGPU={true}
          fallbackToWebGL={true}
          className="w-full h-full"
        >
          <Suspense fallback={<LoadingFallback />}>
            <SceneContent />
          </Suspense>
        </WebGPURenderer>
      ) : (
        <Canvas {...canvasProps} className="w-full h-full">
          <Suspense fallback={<LoadingFallback />}>
            <SceneContent />
          </Suspense>
        </Canvas>
      )}
      
      {/* Performance indicator */}
      <div className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur rounded-lg text-white/70 text-xs">
        {performanceLevel.toUpperCase()} | {enableWebGPU ? 'WebGPU' : 'WebGL'}
      </div>
    </div>
  )
}