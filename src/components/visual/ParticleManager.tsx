'use client'
import { useRef, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GPUParticleSystem, ParticleTrail } from './GPUParticleSystem'
import { useAudioStore } from '@/store/useAudioEngine'
import { nanoid } from 'nanoid'

interface ParticleEffect {
  id: string
  type: 'explosion' | 'trail' | 'ambient'
  position: THREE.Vector3
  color: THREE.Color
  intensity: number
  duration: number
  startTime: number
}

interface ParticleManagerProps {
  maxParticles?: number
  ambientParticles?: boolean
  theme?: 'cyberpunk' | 'organic' | 'crystal' | 'plasma' | 'ethereal'
}

export default function ParticleManager({ 
  maxParticles = 50000,
  ambientParticles = true,
  theme = 'ethereal'
}: ParticleManagerProps) {
  const [effects, setEffects] = useState<ParticleEffect[]>([])
  const [trails, setTrails] = useState<any[]>([])
  const { fftData, volume } = useAudioStore()
  const lastBeatTime = useRef(0)
  const beatThreshold = useRef(0.3)

  // Theme-based particle configurations
  const themeConfig = {
    cyberpunk: {
      colors: [
        new THREE.Color(0x00ffff),
        new THREE.Color(0xff00ff), 
        new THREE.Color(0xffff00)
      ],
      ambientType: 'flow' as const,
      explosionIntensity: 2.0,
    },
    organic: {
      colors: [
        new THREE.Color(0x00ff88),
        new THREE.Color(0x88ff00),
        new THREE.Color(0x00ffaa)
      ],
      ambientType: 'organic' as const,
      explosionIntensity: 1.5,
    },
    crystal: {
      colors: [
        new THREE.Color(0xffffff),
        new THREE.Color(0xccffff),
        new THREE.Color(0xffffcc)
      ],
      ambientType: 'cymatic' as const,
      explosionIntensity: 3.0,
    },
    plasma: {
      colors: [
        new THREE.Color(0xff0066),
        new THREE.Color(0x6600ff),
        new THREE.Color(0xff6600)
      ],
      ambientType: 'spiral' as const,
      explosionIntensity: 2.5,
    },
    ethereal: {
      colors: [
        new THREE.Color(0x88aaff),
        new THREE.Color(0xaa88ff),
        new THREE.Color(0x88ffaa)
      ],
      ambientType: 'cymatic' as const,
      explosionIntensity: 1.8,
    },
  }

  const config = themeConfig[theme]

  // Beat detection for triggering effects
  const detectBeat = useCallback(() => {
    if (!fftData || fftData.length === 0) return false

    const bassEnd = Math.floor(fftData.length * 0.1)
    const bassLevel = fftData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
    
    const now = Date.now()
    const timeSinceLastBeat = now - lastBeatTime.current
    
    // Adaptive threshold
    beatThreshold.current = Math.max(0.2, beatThreshold.current * 0.995)
    
    if (bassLevel > beatThreshold.current && timeSinceLastBeat > 200) {
      lastBeatTime.current = now
      beatThreshold.current = Math.min(0.8, bassLevel * 1.1)
      return true
    }
    
    return false
  }, [fftData])

  // Add particle effect
  const addEffect = useCallback((
    type: ParticleEffect['type'],
    position: THREE.Vector3,
    color?: THREE.Color,
    intensity = 1.0,
    duration = 3000
  ) => {
    const effect: ParticleEffect = {
      id: nanoid(),
      type,
      position: position.clone(),
      color: color || config.colors[Math.floor(Math.random() * config.colors.length)],
      intensity,
      duration,
      startTime: Date.now()
    }
    
    setEffects(prev => [...prev.slice(-20), effect]) // Limit to 20 recent effects
  }, [config.colors])

  // Add particle trail
  const addTrail = useCallback((
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    color?: THREE.Color
  ) => {
    const trail = {
      id: nanoid(),
      startPosition: startPos.clone(),
      endPosition: endPos.clone(),
      color: color || config.colors[Math.floor(Math.random() * config.colors.length)],
      duration: 2000,
      startTime: Date.now()
    }
    
    setTrails(prev => [...prev.slice(-10), trail]) // Limit to 10 trails
  }, [config.colors])

  // Trigger beat explosion
  const triggerBeatExplosion = useCallback((position: THREE.Vector3) => {
    addEffect('explosion', position, undefined, config.explosionIntensity)
    
    // Add multiple smaller explosions around the main one
    for (let i = 0; i < 3; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      )
      
      setTimeout(() => {
        addEffect('explosion', position.clone().add(offset), undefined, config.explosionIntensity * 0.6)
      }, i * 100)
    }
  }, [addEffect, config.explosionIntensity])

  // Auto-trigger effects based on audio
  useFrame(() => {
    if (detectBeat()) {
      // Trigger explosion at random position
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20
      )
      triggerBeatExplosion(position)
    }

    // Clean up expired effects
    const now = Date.now()
    setEffects(prev => prev.filter(effect => now - effect.startTime < effect.duration))
    setTrails(prev => prev.filter(trail => now - trail.startTime < trail.duration))
  })

  // Public API for triggering effects
  const particleAPI = {
    triggerExplosion: (position: THREE.Vector3, color?: THREE.Color, intensity = 1.0) => {
      addEffect('explosion', position, color, intensity)
    },
    
    triggerTrail: (start: THREE.Vector3, end: THREE.Vector3, color?: THREE.Color) => {
      addTrail(start, end, color)
    },
    
    triggerAmbient: (position: THREE.Vector3, color?: THREE.Color) => {
      addEffect('ambient', position, color, 0.5, 5000)
    }
  }

  // Expose API via ref
  useRef(particleAPI)

  return (
    <group>
      {/* Ambient background particles */}
      {ambientParticles && (
        <>
          <GPUParticleSystem
            count={Math.floor(maxParticles * 0.3)}
            type={config.ambientType}
            color={config.colors[0]}
            position={[0, 0, 0]}
            intensity={0.5}
          />
          
          {/* Secondary ambient layer */}
          <GPUParticleSystem
            count={Math.floor(maxParticles * 0.2)}
            type="flow"
            color={config.colors[1]}
            position={[0, 5, 0]}
            intensity={0.3}
          />
        </>
      )}

      {/* Dynamic particle effects */}
      {effects.map(effect => {
        const age = (Date.now() - effect.startTime) / effect.duration
        const fadeIntensity = effect.intensity * (1 - age)
        
        if (age > 1) return null

        switch (effect.type) {
          case 'explosion':
            return (
              <GPUParticleSystem
                key={effect.id}
                count={Math.floor(maxParticles * 0.1)}
                type="explosive"
                color={effect.color}
                position={[effect.position.x, effect.position.y, effect.position.z]}
                intensity={fadeIntensity}
              />
            )
            
          case 'ambient':
            return (
              <GPUParticleSystem
                key={effect.id}
                count={Math.floor(maxParticles * 0.05)}
                type="organic"
                color={effect.color}
                position={[effect.position.x, effect.position.y, effect.position.z]}
                intensity={fadeIntensity}
              />
            )
            
          default:
            return null
        }
      })}

      {/* Particle trails */}
      {trails.map(trail => (
        <ParticleTrail
          key={trail.id}
          startPosition={trail.startPosition}
          endPosition={trail.endPosition}
          color={trail.color}
          duration={trail.duration}
          particleCount={50}
        />
      ))}
    </group>
  )
}

// Export for external triggering
export { type ParticleEffect }