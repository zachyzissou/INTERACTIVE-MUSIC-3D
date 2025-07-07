'use client'
import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioSettings } from '@/store/useAudioSettings'

interface AudioReactiveOrbProps {
  frequency?: number
  color?: string
  intensity?: number
}

function AudioReactiveOrb({ frequency = 1, color = '#ff006e', intensity = 1 }: AudioReactiveOrbProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  // Get audio context and analyzer
  useEffect(() => {
    let animationId: number
    let analyzer: AnalyserNode
    
    const setupAudio = async () => {
      try {
        // Get user media for microphone input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        
        analyzer = audioContext.createAnalyser()
        analyzer.fftSize = 256
        source.connect(analyzer)
        
        const dataArray = new Uint8Array(analyzer.frequencyBinCount)
        
        const updateAudio = () => {
          analyzer.getByteFrequencyData(dataArray)
          
          // Calculate average frequency in specific range
          const start = Math.floor(frequency * dataArray.length / 4)
          const end = Math.min(start + 10, dataArray.length)
          const slice = dataArray.slice(start, end)
          const average = slice.reduce((a, b) => a + b, 0) / slice.length
          
          setAudioLevel(average / 255) // Normalize to 0-1
          animationId = requestAnimationFrame(updateAudio)
        }
        
        updateAudio()
      } catch (error) {
        console.warn('Audio access denied or not available')
        // Fallback to simulated audio
        const simulateAudio = () => {
          setAudioLevel(Math.sin(Date.now() * 0.005) * 0.5 + 0.5)
          animationId = requestAnimationFrame(simulateAudio)
        }
        simulateAudio()
      }
    }
    
    setupAudio()
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [frequency])

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return
    
    const time = state.clock.elapsedTime
    const reactionStrength = audioLevel * intensity
    
    // Reactive scaling
    const scale = 1 + reactionStrength * 0.5
    meshRef.current.scale.setScalar(scale)
    
    // Reactive distortion
    materialRef.current.distort = 0.2 + reactionStrength * 0.8
    materialRef.current.speed = 0.5 + reactionStrength * 2
    
    // Color intensity based on audio
    const colorIntensity = 0.3 + reactionStrength * 0.7
    materialRef.current.color.setHSL(
      (time * 0.1 + frequency) % 1,
      0.8,
      colorIntensity
    )
    
    // Floating motion
    meshRef.current.position.y = Math.sin(time * 0.5 + frequency) * 0.2
    meshRef.current.rotation.x = time * 0.2
    meshRef.current.rotation.y = time * 0.3
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        distort={0.4}
        speed={1}
        roughness={0.1}
        metalness={0.8}
      />
    </Sphere>
  )
}

interface AudioVisualizerProps {
  className?: string
}

export function AudioVisualizer({ className = '' }: AudioVisualizerProps) {
  const volume = useAudioSettings(s => s.volume)
  
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff006e" />
        
        {/* Multiple audio-reactive orbs */}
        <AudioReactiveOrb frequency={0.1} color="#ff006e" intensity={volume} />
        <AudioReactiveOrb frequency={0.3} color="#8338ec" intensity={volume * 0.8} />
        <AudioReactiveOrb frequency={0.6} color="#3a86ff" intensity={volume * 0.6} />
        <AudioReactiveOrb frequency={0.9} color="#06ffa5" intensity={volume * 0.4} />
      </Canvas>
    </div>
  )
}

export default AudioVisualizer
