'use client'
import { useRef, useEffect, useState, ReactNode } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { Draggable } from 'gsap/Draggable'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable)
}

interface FloatingPanelProps {
  children: ReactNode
  position?: [number, number, number]
  title: string
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  orbitRadius?: number
  orbitSpeed?: number
  isDraggable?: boolean
  minimizable?: boolean
  className?: string
  onClose?: () => void
  onMinimize?: () => void
}

export default function FloatingPanel({
  children,
  position = [0, 0, 0],
  title,
  theme = 'glass',
  orbitRadius = 0,
  orbitSpeed = 0,
  isDraggable = true,
  minimizable = true,
  className = '',
  onClose,
  onMinimize
}: FloatingPanelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const orbitRef = useRef({ angle: Math.random() * Math.PI * 2 })

  // Theme configurations
  const themeStyles = {
    cyber: {
      background: 'linear-gradient(135deg, rgba(0,255,255,0.1) 0%, rgba(255,0,255,0.1) 100%)',
      border: '1px solid rgba(0,255,255,0.5)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      color: '#00ffff',
      headerBg: 'rgba(0,255,255,0.2)',
    },
    glass: {
      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      border: '1px solid rgba(255,255,255,0.2)',
      backdropFilter: 'blur(25px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      color: '#ffffff',
      headerBg: 'rgba(255,255,255,0.1)',
    },
    neon: {
      background: 'linear-gradient(135deg, rgba(255,0,128,0.1) 0%, rgba(128,0,255,0.1) 100%)',
      border: '1px solid rgba(255,0,128,0.8)',
      backdropFilter: 'blur(15px)',
      boxShadow: '0 0 20px rgba(255,0,128,0.6), 0 0 40px rgba(128,0,255,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      color: '#ff0080',
      headerBg: 'rgba(255,0,128,0.2)',
    },
    plasma: {
      background: 'linear-gradient(135deg, rgba(255,100,0,0.1) 0%, rgba(255,0,100,0.1) 50%, rgba(100,0,255,0.1) 100%)',
      border: '1px solid rgba(255,100,0,0.6)',
      backdropFilter: 'blur(18px)',
      boxShadow: '0 8px 32px rgba(255,100,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      color: '#ff6400',
      headerBg: 'rgba(255,100,0,0.2)',
    },
  }

  const currentTheme = themeStyles[theme]

  // Orbital motion
  useFrame((state, delta) => {
    if (!groupRef.current || isDragging) return

    if (orbitRadius > 0 && orbitSpeed > 0) {
      orbitRef.current.angle += orbitSpeed * delta
      const x = Math.cos(orbitRef.current.angle) * orbitRadius + position[0]
      const z = Math.sin(orbitRef.current.angle) * orbitRadius + position[2]
      
      gsap.to(groupRef.current.position, {
        x,
        z,
        duration: 0.1,
        ease: 'none'
      })
    }

    // Gentle floating animation
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02
  })

  // Initialize GSAP dragging
  useEffect(() => {
    if (!panelRef.current || !isDraggable) return

    const draggable = Draggable.create(panelRef.current, {
      type: 'x,y',
      bounds: 'body',
      edgeResistance: 0.65,
      dragResistance: 0.2,
      inertia: true,
      onDragStart: () => {
        setIsDragging(true)
        gsap.to(panelRef.current, {
          scale: 1.05,
          duration: 0.2,
          ease: 'power2.out'
        })
      },
      onDragEnd: () => {
        setIsDragging(false)
        gsap.to(panelRef.current, {
          scale: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.5)'
        })
      },
      onDrag: function() {
        // Update 3D position based on 2D drag
        if (groupRef.current) {
          const rect = panelRef.current!.getBoundingClientRect()
          const x = (rect.left / window.innerWidth - 0.5) * 10
          const y = -(rect.top / window.innerHeight - 0.5) * 6
          
          gsap.to(groupRef.current.position, {
            x: x + position[0],
            y: y + position[1],
            duration: 0.1
          })
        }
      }
    })

    return () => {
      draggable[0]?.kill()
    }
  }, [isDraggable, position])

  // Panel animations
  const handleMinimize = () => {
    const newState = !isMinimized
    setIsMinimized(newState)
    
    gsap.to(panelRef.current, {
      height: newState ? '60px' : 'auto',
      duration: 0.4,
      ease: 'power3.inOut'
    })

    if (onMinimize) onMinimize()
  }

  const handleClose = () => {
    gsap.to(panelRef.current, {
      scale: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (onClose) onClose()
      }
    })
  }

  // Spawn animation
  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, 
        {
          scale: 0,
          opacity: 0,
          rotationX: -90,
        },
        {
          scale: 1,
          opacity: 1,
          rotationX: 0,
          duration: 0.8,
          ease: 'elastic.out(1, 0.3)',
          delay: Math.random() * 0.5
        }
      )
    }
  }, [])

  return (
    <group ref={groupRef} position={position}>
      <Html
        transform
        occlude={false}
        sprite
        distanceFactor={10}
        position={[0, 0, 0]}
      >
        <div
          ref={panelRef}
          className={`
            floating-panel relative min-w-[300px] max-w-[400px] 
            rounded-2xl overflow-hidden transition-all duration-300
            ${isDraggable ? 'cursor-move' : ''}
            ${isDragging ? 'z-50' : 'z-10'}
            ${className}
          `}
          style={{
            background: currentTheme.background,
            border: currentTheme.border,
            backdropFilter: currentTheme.backdropFilter,
            boxShadow: currentTheme.boxShadow,
            color: currentTheme.color,
            fontFamily: 'monospace, sans-serif',
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-white/20"
            style={{ background: currentTheme.headerBg }}
          >
            <h3 className="font-bold text-lg truncate">{title}</h3>
            <div className="flex gap-2 ml-4">
              {minimizable && (
                <button
                  onClick={handleMinimize}
                  className="w-6 h-6 rounded-full border border-current opacity-70 hover:opacity-100 
                           flex items-center justify-center text-xs transition-opacity"
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  {isMinimized ? '+' : '−'}
                </button>
              )}
              {onClose && (
                <button
                  onClick={handleClose}
                  className="w-6 h-6 rounded-full border border-current opacity-70 hover:opacity-100 
                           flex items-center justify-center text-xs transition-opacity"
                  title="Close"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div 
            className={`transition-all duration-300 ${
              isMinimized ? 'h-0 overflow-hidden' : 'p-4'
            }`}
          >
            {children}
          </div>

          {/* Animated border effect */}
          <div 
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `linear-gradient(45deg, ${currentTheme.color}20, transparent, ${currentTheme.color}20)`,
              animation: 'borderPulse 3s ease-in-out infinite'
            }}
          />
        </div>

        <style jsx>{`
          @keyframes borderPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }
          
          .floating-panel {
            transition: transform 0.2s ease-out;
          }
          
          .floating-panel:hover {
            transform: translateY(-2px);
          }
          
          /* Custom scrollbar */
          .floating-panel ::-webkit-scrollbar {
            width: 4px;
          }
          
          .floating-panel ::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
          }
          
          .floating-panel ::-webkit-scrollbar-thumb {
            background: ${currentTheme.color}60;
            border-radius: 2px;
          }
          
          .floating-panel ::-webkit-scrollbar-thumb:hover {
            background: ${currentTheme.color}80;
          }
        `}</style>
      </Html>
    </group>
  )
}