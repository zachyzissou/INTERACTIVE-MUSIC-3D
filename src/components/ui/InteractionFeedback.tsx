'use client'
import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

interface FeedbackProps {
  position: [number, number, number]
  type: 'click' | 'hover' | 'success' | 'error' | 'audio-trigger'
  color?: string
  duration?: number
  onComplete?: () => void
}

export function InteractionFeedback({ 
  position, 
  type, 
  color = '#00ffff', 
  duration = 1000,
  onComplete 
}: FeedbackProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (!groupRef.current) return

    const group = groupRef.current
    
    switch (type) {
      case 'click':
        gsap.fromTo(group.scale, 
          { x: 0.1, y: 0.1, z: 0.1 },
          { x: 2, y: 2, z: 2, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
        )
        gsap.to(group.scale, { x: 0, y: 0, z: 0, duration: 0.2, delay: 0.8 })
        break
        
      case 'hover':
        gsap.fromTo(group.scale,
          { x: 0, y: 0, z: 0 },
          { x: 1.5, y: 1.5, z: 1.5, duration: 0.2, ease: 'power2.out' }
        )
        break
        
      case 'success':
        gsap.fromTo(group.rotation,
          { y: 0 },
          { y: Math.PI * 2, duration: 0.6, ease: 'power2.out' }
        )
        gsap.fromTo(group.scale,
          { x: 0, y: 0, z: 0 },
          { x: 3, y: 3, z: 3, duration: 0.4, ease: 'back.out(1.7)' }
        )
        break
        
      case 'audio-trigger':
        gsap.fromTo(group.scale,
          { x: 0, y: 0, z: 0 },
          { x: 4, y: 4, z: 4, duration: 0.2, ease: 'power3.out' }
        )
        gsap.to(group.scale, { x: 0, y: 0, z: 0, duration: 0.6, delay: 0.2 })
        break
    }

    const timer = setTimeout(() => {
      setIsActive(false)
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [type, duration, onComplete])

  if (!isActive) return null

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <ringGeometry args={[0.1, 0.15, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

interface TooltipProps {
  position: [number, number, number]
  text: string
  visible: boolean
}

export function InteractiveTooltip({ position, text, visible }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current, {
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.8,
        duration: 0.2,
        ease: 'power2.out'
      })
    }
  }, [visible])

  return (
    <Html position={position} transform sprite>
      <div
        ref={ref}
        className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm 
                   border border-white/20 pointer-events-none select-none
                   shadow-lg whitespace-nowrap"
        style={{ opacity: 0 }}
      >
        {text}
      </div>
    </Html>
  )
}

// Ripple effect for UI interactions
export function RippleEffect({ 
  position, 
  intensity = 1, 
  color = '#00ffff' 
}: { 
  position: [number, number, number]
  intensity?: number
  color?: string 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 2
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 4) * 0.2 * intensity
      )
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <ringGeometry args={[0.5, 0.7, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}