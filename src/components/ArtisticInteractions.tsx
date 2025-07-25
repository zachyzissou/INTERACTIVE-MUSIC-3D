'use client'
import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { getAnalyserBands } from '../lib/analyser'

// Ripple effect system
class RippleEffect {
  public position: THREE.Vector3
  public radius: number
  public maxRadius: number
  public opacity: number
  public color: THREE.Color
  public speed: number
  public alive: boolean

  constructor(position: THREE.Vector3, color: THREE.Color = new THREE.Color('#4ade80')) {
    this.position = position.clone()
    this.radius = 0
    this.maxRadius = 5 + Math.random() * 3
    this.opacity = 1
    this.color = color
    this.speed = 0.1 + Math.random() * 0.05
    this.alive = true
  }

  update() {
    this.radius += this.speed
    this.opacity = 1 - (this.radius / this.maxRadius)
    
    if (this.radius >= this.maxRadius) {
      this.alive = false
    }
  }
}

// Gesture-driven morphing trails
class MorphTrail {
  public points: THREE.Vector3[]
  public maxPoints: number
  public opacity: number
  public color: THREE.Color

  constructor(startPoint: THREE.Vector3, color: THREE.Color = new THREE.Color('#3b82f6')) {
    this.points = [startPoint.clone()]
    this.maxPoints = 20
    this.opacity = 1
    this.color = color
  }

  addPoint(point: THREE.Vector3) {
    this.points.push(point.clone())
    if (this.points.length > this.maxPoints) {
      this.points.shift()
    }
  }

  update() {
    this.opacity *= 0.99
  }

  isAlive() {
    return this.opacity > 0.01
  }
}

// Interactive blob morphing component
function InteractiveBlobMorpher({
  position,
  onMorph,
  onStretch,
  children
}: {
  position: [number, number, number]
  onMorph?: (delta: THREE.Vector3) => void
  onStretch?: (factor: number) => void
  children: React.ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isStretching, setIsStretching] = useState(false)
  const dragStart = useRef<THREE.Vector3>(new THREE.Vector3())
  const currentPos = useRef<THREE.Vector3>(new THREE.Vector3())

  const { raycaster, mouse, camera } = useThree()

  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation()
    setIsDragging(true)
    
    // Capture initial position
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects([e.object])
    if (intersects.length > 0) {
      dragStart.current.copy(intersects[0].point)
      currentPos.current.copy(intersects[0].point)
    }
  }, [raycaster, mouse, camera])

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging) return

    raycaster.setFromCamera(mouse, camera)
    
    // Create a plane perpendicular to camera for dragging
    const plane = new THREE.Plane()
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    plane.setFromNormalAndCoplanarPoint(cameraDirection, dragStart.current)
    
    const intersectionPoint = new THREE.Vector3()
    raycaster.ray.intersectPlane(plane, intersectionPoint)
    
    if (intersectionPoint) {
      const delta = intersectionPoint.clone().sub(currentPos.current)
      currentPos.current.copy(intersectionPoint)
      
      // Check for stretching gesture (multi-touch simulation with shift key)
      if (e.shiftKey) {
        setIsStretching(true)
        const stretchFactor = delta.length() * 0.1
        onStretch?.(stretchFactor)
      } else {
        onMorph?.(delta)
      }
    }
  }, [isDragging, raycaster, mouse, camera, onMorph, onStretch])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setIsStretching(false)
  }, [])

  // Add event listeners
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('pointermove', handlePointerMove)
      canvas.addEventListener('pointerup', handlePointerUp)
      
      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove)  
        canvas.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [handlePointerMove, handlePointerUp])

  return (
    <group ref={groupRef} position={position}>
      <group onPointerDown={handlePointerDown}>
        {children}
      </group>
      
      {/* Visual feedback for dragging */}
      {isDragging && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial 
            color={isStretching ? '#f59e0b' : '#4ade80'}
            transparent 
            opacity={0.3}
            wireframe 
          />
        </mesh>
      )}
    </group>
  )
}

// Ripple visual effects system
function RippleSystem() {
  const groupRef = useRef<THREE.Group>(null)
  const ripples = useRef<RippleEffect[]>([])
  const meshes = useRef<THREE.Mesh[]>([])

  // Create ripple effect
  const createRipple = useCallback((position: THREE.Vector3, color?: THREE.Color) => {
    const ripple = new RippleEffect(position, color)
    ripples.current.push(ripple)

    // Create visual mesh
    const geometry = new THREE.RingGeometry(0.1, 0.2, 32)
    const material = new THREE.MeshBasicMaterial({
      color: ripple.color,
      transparent: true,
      opacity: ripple.opacity,
      side: THREE.DoubleSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(ripple.position)
    
    if (groupRef.current) {
      groupRef.current.add(mesh)
    }
    meshes.current.push(mesh)
  }, [])

  // Update ripples
  useFrame(() => {
    ripples.current = ripples.current.filter((ripple, index) => {
      ripple.update()
      
      const mesh = meshes.current[index]
      if (mesh && ripple.alive) {
        // Update mesh properties
        mesh.scale.setScalar(ripple.radius)
        const material = mesh.material as THREE.MeshBasicMaterial
        material.opacity = ripple.opacity
        return true
      } else if (mesh) {
        // Remove dead ripple
        if (groupRef.current) {
          groupRef.current.remove(mesh)
        }
        mesh.geometry.dispose()
        const material = mesh.material as THREE.MeshBasicMaterial
        material.dispose()
        meshes.current.splice(index, 1)
        return false
      }
      return false
    })
  })

  // Expose createRipple method
  useEffect(() => {
    ;(window as any).createRipple = createRipple
    return () => {
      delete (window as any).createRipple
    }
  }, [createRipple])

  return <group ref={groupRef} />
}

// Narrative music building prompts
function NarrativePrompts() {
  const [currentPrompt, setCurrentPrompt] = useState(0)
  const [showPrompts, setShowPrompts] = useState(false)
  
  const prompts = useMemo(() => [
    {
      title: "🌅 Begin Your Musical Journey",
      description: "Click any glowing blob to awaken it with sound. Each blob holds a unique musical note waiting to be discovered.",
      color: '#4ade80'
    },
    {
      title: "🎵 Create Harmonic Resonance", 
      description: "Try clicking multiple blobs in sequence. Notice how they respond to each other, creating layers of harmony.",
      color: '#3b82f6'
    },
    {
      title: "🌊 Flow with the Audio Waves",
      description: "Watch how the blobs pulse and morph with the music. Drag them around to reshape their sonic landscape.",
      color: '#8b5cf6'
    },
    {
      title: "✨ Master the Artistic Canvas",
      description: "Use different musical keys and scales to change the color palette. Each combination tells a different story.",
      color: '#f59e0b'
    }
  ], [])

  useEffect(() => {
    // Auto-advance prompts
    const interval = setInterval(() => {
      setCurrentPrompt(prev => (prev + 1) % prompts.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [prompts.length])

  useEffect(() => {
    // Show prompts initially, then hide after user interaction
    setShowPrompts(true)
    
    const hidePrompts = () => {
      setTimeout(() => setShowPrompts(false), 10000)
    }
    
    window.addEventListener('click', hidePrompts, { once: true })
    return () => window.removeEventListener('click', hidePrompts)
  }, [])

  if (!showPrompts) return null

  const prompt = prompts[currentPrompt]

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(20px)',
      padding: '32px',
      borderRadius: '20px',
      border: `2px solid ${prompt.color}`,
      boxShadow: `0 0 40px ${prompt.color}40`,
      color: 'white',
      textAlign: 'center',
      maxWidth: '500px',
      zIndex: 2000,
      animation: 'fadeInUp 0.6s ease-out'
    }}>
      <div style={{
        fontSize: '24px',
        fontWeight: '300',
        marginBottom: '16px',
        color: prompt.color
      }}>
        {prompt.title}
      </div>
      
      <div style={{
        fontSize: '16px',
        lineHeight: '1.6',
        opacity: 0.9,
        marginBottom: '24px'
      }}>
        {prompt.description}
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px'
      }}>
        {prompts.map((_, index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index === currentPrompt ? prompt.color : 'rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
      
      <button
        onClick={() => setShowPrompts(false)}
        style={{
          background: 'transparent',
          border: `1px solid ${prompt.color}`,
          borderRadius: '25px',
          padding: '8px 16px',
          color: prompt.color,
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = prompt.color
          e.currentTarget.style.color = 'black'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = prompt.color
        }}
      >
        Continue Exploring
      </button>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  )
}

// Audio-reactive gesture feedback
function AudioGestureFeedback() {
  const particlesRef = useRef<THREE.Points>(null)
  const [particles] = useState(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(100 * 3)
    const colors = new Float32Array(100 * 3)
    
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20  
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      
      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    return geometry
  })

  useFrame(() => {
    if (particlesRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        
        // Audio-reactive particle movement
        const positions = particles.getAttribute('position') as THREE.BufferAttribute
        const positionsArray = positions.array as Float32Array
        
        for (let i = 0; i < positionsArray.length; i += 3) {
          positionsArray[i + 1] += Math.sin(Date.now() * 0.001 + i) * audioLevel * 0.1
        }
        
        positions.needsUpdate = true
        
        // Scale particles based on audio
        particlesRef.current.scale.setScalar(1 + audioLevel * 0.5)
        
      } catch (error) {
        // Fallback
      }
    }
  })

  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  }), [])

  return (
    <points ref={particlesRef} geometry={particles} material={material} />
  )
}

// Main artistic interactions component
export default function ArtisticInteractions() {
  const [interactionMode, setInteractionMode] = useState<'explore' | 'create' | 'perform'>('explore')
  
  // Keyboard shortcuts for interaction modes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case '1':
          setInteractionMode('explore')
          break
        case '2':
          setInteractionMode('create')
          break
        case '3':
          setInteractionMode('perform')
          break
        case 'escape':
          setInteractionMode('explore')
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <group>
      {/* Ripple effects system */}
      <RippleSystem />
      
      {/* Audio-reactive gesture feedback */}
      <AudioGestureFeedback />
      
      {/* Narrative prompts overlay */}
      <NarrativePrompts />
      
      {/* Mode indicator */}
      <mesh position={[0, -6, 0]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial 
          color={
            interactionMode === 'explore' ? '#4ade80' :
            interactionMode === 'create' ? '#3b82f6' : '#f59e0b'
          }
          transparent
          opacity={0.0} // Hidden but available for future use
        />
      </mesh>
    </group>
  )
}

// Enhanced blob morpher wrapper
export function withArtisticInteractions<T extends object>(
  Component: React.ComponentType<T>
) {
  return function EnhancedComponent(props: T & { position?: [number, number, number] }) {
    const handleMorph = useCallback((delta: THREE.Vector3) => {
      // Create ripple effect at morph location
      if ((window as any).createRipple) {
        const position = new THREE.Vector3(...(props.position || [0, 0, 0]))
        ;(window as any).createRipple(position, new THREE.Color('#4ade80'))
      }
    }, [props.position])

    const handleStretch = useCallback((factor: number) => {
      // Visual feedback for stretching
      if ((window as any).createRipple) {
        const position = new THREE.Vector3(...(props.position || [0, 0, 0]))
        ;(window as any).createRipple(position, new THREE.Color('#f59e0b'))
      }
    }, [props.position])

    return (
      <InteractiveBlobMorpher
        position={props.position || [0, 0, 0]}
        onMorph={handleMorph}
        onStretch={handleStretch}
      >
        <Component {...props} />
      </InteractiveBlobMorpher>
    )
  }
}