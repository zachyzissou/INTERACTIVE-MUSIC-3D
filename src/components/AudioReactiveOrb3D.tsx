'use client'
import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface AudioReactiveOrb3DProps {
  position?: [number, number, number]
  frequency?: number
  color?: string
  intensity?: number
}

export default function AudioReactiveOrb3D({ 
  position = [0, 0, 0], 
  frequency = 1, 
  color = '#ff006e', 
  intensity = 1 
}: AudioReactiveOrb3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  
  // Get audio context and analyzer
  useEffect(() => {
    let animationId: number
    let analyzer: AnalyserNode
    
    const setupAudio = async () => {
      try {
        // Try to connect to existing audio context or create fallback
        const existingContext = (window as any).audioContext
        if (existingContext && existingContext.state === 'running') {
          analyzer = existingContext.createAnalyser()
          analyzer.fftSize = 256
          
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
        } else {
          // Fallback to time-based animation
          const simulateAudio = () => {
            const time = Date.now() * 0.001
            setAudioLevel(
              (Math.sin(time * frequency * 2) * 0.3 + 0.3) +
              (Math.sin(time * frequency * 3.7) * 0.2 + 0.2) +
              (Math.sin(time * frequency * 0.8) * 0.3 + 0.3)
            )
            animationId = requestAnimationFrame(simulateAudio)
          }
          simulateAudio()
        }
      } catch (error) {
        console.warn('Audio visualization fallback mode')
        // Artistic fallback animation
        const simulateAudio = () => {
          const time = Date.now() * 0.001
          setAudioLevel(
            (Math.sin(time * frequency * 2) * 0.3 + 0.3) +
            (Math.sin(time * frequency * 3.7) * 0.2 + 0.2) +
            (Math.sin(time * frequency * 0.8) * 0.3 + 0.3)
          )
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
    
    // Reactive scaling with smooth interpolation
    const targetScale = 0.8 + reactionStrength * 0.6
    const currentScale = meshRef.current.scale.x
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1)
    meshRef.current.scale.setScalar(newScale)
    
    // Reactive distortion
    materialRef.current.distort = 0.1 + reactionStrength * 0.4
    materialRef.current.speed = 0.5 + reactionStrength * 1.5
    
    // Dynamic color based on audio and time
    const hue = (time * 0.05 + frequency * 0.3) % 1
    const saturation = 0.7 + reactionStrength * 0.3
    const lightness = 0.4 + reactionStrength * 0.4
    
    materialRef.current.color.setHSL(hue, saturation, lightness)
    
    // Organic floating motion
    meshRef.current.position.x = position[0] + Math.sin(time * 0.3 + frequency) * (0.5 + reactionStrength * 0.5)
    meshRef.current.position.y = position[1] + Math.cos(time * 0.4 + frequency * 1.2) * (0.3 + reactionStrength * 0.4)
    meshRef.current.position.z = position[2] + Math.sin(time * 0.2 + frequency * 0.8) * (0.2 + reactionStrength * 0.3)
    
    // Rotation based on audio
    meshRef.current.rotation.x = time * (0.1 + reactionStrength * 0.2)
    meshRef.current.rotation.y = time * (0.15 + reactionStrength * 0.25)
    meshRef.current.rotation.z = time * (0.05 + reactionStrength * 0.1)
  })

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]}>
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        attach="material"
        distort={0.2}
        speed={0.5}
        roughness={0.2}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </Sphere>
  )
}
