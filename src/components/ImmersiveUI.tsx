'use client'
import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { useMusicalPalette } from '../store/useMusicalPalette'
import { getAnalyserBands } from '../lib/analyser'

// Floating UI Orb Component
function FloatingUIOrb({ 
  position, 
  radius = 5, 
  speed = 0.5, 
  children,
  onHover,
  onLeave,
  visible = true
}: {
  position: [number, number, number]
  radius?: number
  speed?: number
  children: React.ReactNode
  onHover?: () => void
  onLeave?: () => void
  visible?: boolean
}) {
  const orbRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (orbRef.current) {
      const time = state.clock.elapsedTime
      
      // Orbital motion
      orbRef.current.position.x = position[0] + Math.cos(time * speed) * radius
      orbRef.current.position.y = position[1] + Math.sin(time * speed * 0.7) * 2
      orbRef.current.position.z = position[2] + Math.sin(time * speed) * radius
      
      // Audio-reactive scaling
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        const scale = 1 + audioLevel * 0.2
        orbRef.current.scale.setScalar(scale)
      } catch (error) {
        // Fallback
      }
      
      // Face camera
      orbRef.current.lookAt(state.camera.position)
    }
  })
  
  const handlePointerOver = () => {
    setHovered(true)
    onHover?.()
  }
  
  const handlePointerOut = () => {
    setHovered(false)
    onLeave?.()
  }
  
  if (!visible) return null
  
  return (
    <group ref={orbRef}>
      {/* Orb background */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={hovered ? '#4ade80' : '#3b82f6'}
          transparent
          opacity={hovered ? 0.8 : 0.5}
        />
      </mesh>
      
      {/* HTML content */}
      <Html
        transform
        occlude="blending"
        position={[0, 0, 0.35]}
        style={{
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.3s ease',
          pointerEvents: hovered ? 'auto' : 'none'
        }}
      >
        <div style={{
          background: 'rgba(15, 15, 35, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          color: 'white',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          minWidth: '200px',
          maxWidth: '280px',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: hovered ? 'auto' : 'none'
        }}>
          {children}
        </div>
      </Html>
    </group>
  )
}

// Musical Control Orb
function MusicalControlOrb() {
  const { key, scale, tempo, setKey, setScale, setTempo } = useMusicalPalette()
  const [showControls, setShowControls] = useState(false)
  
  return (
    <FloatingUIOrb
      position={[0, 3, 0]}
      radius={6}
      speed={0.3}
      onHover={() => setShowControls(true)}
      onLeave={() => setShowControls(false)}
      visible={true}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #4ade80, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎵 Musical Controls
        </div>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ opacity: 0.8 }}>Key:</span>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'white',
                fontSize: '11px'
              }}
            >
              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(k => (
                <option key={k} value={k} style={{ background: '#1a1a2e' }}>{k}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ opacity: 0.8 }}>Scale:</span>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: 'white',
                fontSize: '11px'
              }}
            >
              {['major', 'minor', 'dorian', 'mixolydian', 'pentatonic', 'blues'].map(s => (
                <option key={s} value={s} style={{ background: '#1a1a2e', textTransform: 'capitalize' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ opacity: 0.8 }}>Tempo:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                style={{
                  width: '80px',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  outline: 'none',
                  borderRadius: '2px',
                  appearance: 'none'
                }}
              />
              <span style={{ fontSize: '10px', minWidth: '35px' }}>{tempo}</span>
            </div>
          </div>
        </div>
      </div>
    </FloatingUIOrb>
  )
}

// Audio Visualization Orb
function AudioVisualizationOrb() {
  const [audioData, setAudioData] = useState({ bass: 0, mid: 0, treble: 0 })
  
  useFrame(() => {
    try {
      const { bass, mid, treble } = getAnalyserBands()
      setAudioData({
        bass: bass / 255,
        mid: mid / 255,
        treble: treble / 255
      })
    } catch (error) {
      // Fallback
    }
  })
  
  return (
    <FloatingUIOrb
      position={[0, -2, 0]}
      radius={8}
      speed={0.4}
      visible={true}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎧 Audio Analysis
        </div>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '40px', fontSize: '11px', opacity: 0.8 }}>Bass</span>
            <div style={{
              flex: 1,
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.bass * 100}%`,
                background: 'linear-gradient(90deg, #ef4444, #f97316)',
                borderRadius: '3px',
                transition: 'width 0.1s ease'
              }} />
            </div>
            <span style={{ fontSize: '10px', minWidth: '30px' }}>
              {Math.round(audioData.bass * 100)}%
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '40px', fontSize: '11px', opacity: 0.8 }}>Mid</span>
            <div style={{
              flex: 1,
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.mid * 100}%`,
                background: 'linear-gradient(90deg, #10b981, #06d6a0)',
                borderRadius: '3px',
                transition: 'width 0.1s ease'
              }} />
            </div>
            <span style={{ fontSize: '10px', minWidth: '30px' }}>
              {Math.round(audioData.mid * 100)}%
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ minWidth: '40px', fontSize: '11px', opacity: 0.8 }}>Treble</span>
            <div style={{
              flex: 1,
              height: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${audioData.treble * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '3px',
                transition: 'width 0.1s ease'
              }} />
            </div>
            <span style={{ fontSize: '10px', minWidth: '30px' }}>
              {Math.round(audioData.treble * 100)}%
            </span>
          </div>
        </div>
      </div>
    </FloatingUIOrb>
  )
}

// Help/Tutorial Orb
function HelpOrb() {
  return (
    <FloatingUIOrb
      position={[0, 0, -8]}
      radius={4}
      speed={0.2}
      visible={true}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          💡 Interaction Guide
        </div>
        
        <div style={{ display: 'grid', gap: '6px', fontSize: '11px', lineHeight: '1.4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🖱️</span>
            <span>Click blobs to create music</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🌀</span>
            <span>Drag to orbit the scene</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🔍</span>
            <span>Scroll to zoom in/out</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✨</span>
            <span>Hover orbs for controls</span>
          </div>
        </div>
      </div>
    </FloatingUIOrb>
  )
}

// 3D Hologram Text Labels
function HologramLabel({ 
  position, 
  text, 
  color = '#4ade80',
  size = 0.5 
}: {
  position: [number, number, number]
  text: string
  color?: string
  size?: number
}) {
  const textRef = useRef<any>(null)
  
  useFrame((state) => {
    if (textRef.current) {
      // Gentle floating animation
      const time = state.clock.elapsedTime
      textRef.current.position.y = position[1] + Math.sin(time * 2) * 0.1
      
      // Face camera
      textRef.current.lookAt(state.camera.position)
      
      // Audio-reactive glow
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        textRef.current.material.emissiveIntensity = 0.2 + audioLevel * 0.3
      } catch (error) {
        textRef.current.material.emissiveIntensity = 0.2
      }
    }
  })
  
  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="/fonts/inter-medium.woff"
    >
      {text}
      <meshBasicMaterial 
        transparent 
        opacity={0.9}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Text>
  )
}

// Main Immersive UI Component
export default function ImmersiveUI() {
  const [uiVisible, setUiVisible] = useState(true)
  const [mouseIdle, setMouseIdle] = useState(false)
  
  // Auto-hide UI when mouse is idle
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const resetTimeout = () => {
      clearTimeout(timeout)
      setMouseIdle(false)
      timeout = setTimeout(() => setMouseIdle(true), 5000)
    }
    
    const handleMouseMove = () => resetTimeout()
    const handleKeyPress = () => resetTimeout()
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keypress', handleKeyPress)
    resetTimeout()
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [])
  
  // Gesture controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setUiVisible(!uiVisible)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [uiVisible])
  
  if (!uiVisible) {
    return (
      <HologramLabel
        position={[0, -4, 0]}
        text="Press 'H' to show UI"
        size={0.3}
        color="#666666"
      />
    )
  }
  
  return (
    <group>
      {/* Floating UI Orbs */}
      <MusicalControlOrb />
      <AudioVisualizationOrb />
      <HelpOrb />
      
      {/* 3D Labels */}
      <HologramLabel
        position={[0, 6, 0]}
        text="SONIC CANVAS"
        size={0.8}
        color="#4ade80"
      />
      
      {/* Subtle status indicators */}
      {!mouseIdle && (
        <HologramLabel
          position={[0, -5, 0]}
          text="Press 'H' to toggle UI"
          size={0.25}
          color="#888888"
        />
      )}
    </group>
  )
}