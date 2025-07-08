'use client'
import React, { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { X, Move, Minimize2 } from 'lucide-react'
import styles from './FloatingPanel.module.css'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Draggable)
}

export interface FloatingPanelProps {
  readonly children: React.ReactNode
  readonly title?: string
  readonly defaultPosition?: { x: number; y: number }
  readonly defaultSize?: { width: number; height: number }
  readonly isVisible?: boolean
  readonly onVisibilityChange?: (visible: boolean) => void
  readonly className?: string
  readonly isDraggable?: boolean
  readonly variant?: 'glass' | 'neon' | 'cyber' | 'minimal'
}

export function FloatingPanel({
  children,
  title,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 300 },
  isVisible = true,
  onVisibilityChange,
  className = '',
  isDraggable = true,
  variant = 'glass',
}: FloatingPanelProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [size] = useState(defaultSize)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [zIndex, setZIndex] = useState(10)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const draggableInstance = useRef<any>(null)

  const getVariantClass = () => {
    switch (variant) {
      case 'glass': return styles.glassPanel
      case 'neon': return styles.neonPanel
      case 'cyber': return styles.cyberPanel
      case 'minimal': return styles.minimalPanel
      default: return styles.glassPanel
    }
  }

  const handleClose = () => {
    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => onVisibilityChange?.(false)
      })
    }
  }

  const handleMinimize = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    
    if (contentRef.current) {
      if (newMinimized) {
        gsap.to(contentRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.2,
          ease: "power2.out"
        })
      } else {
        gsap.set(contentRef.current, { height: 'auto' })
        gsap.fromTo(contentRef.current, 
          { height: 0, opacity: 0 },
          { height: 'auto', opacity: 1, duration: 0.2, ease: "power2.out" }
        )
      }
    }
  }

  const handleButtonHover = (element: HTMLElement, isEntering: boolean) => {
    gsap.to(element, {
      scale: isEntering ? 1.1 : 1,
      duration: 0.2,
      ease: "power2.out"
    })
  }

  const handleButtonClick = (element: HTMLElement) => {
    gsap.to(element, {
      scale: 0.9,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.1,
          ease: "power2.out"
        })
      }
    })
  }

  useEffect(() => {
    if (panelRef.current && isVisible) {
      // Initial animation
      gsap.set(panelRef.current, { opacity: 0, scale: 0.8, y: 20 })
      gsap.to(panelRef.current, {
        opacity: 1,
        scale: 1,
        x: position.x,
        y: position.y,
        duration: 0.4,
        ease: "back.out(1.7)"
      })

      // Setup draggable
      if (isDraggable && typeof window !== 'undefined') {
        draggableInstance.current = Draggable.create(panelRef.current, {
          type: "x,y",
          bounds: "body",
          onDragStart: () => {
            setIsDragging(true)
            setZIndex(1000)
          },
          onDragEnd: () => {
            setIsDragging(false)
            setZIndex(10)
            const element = panelRef.current
            if (element) {
              const transform = gsap.getProperty(element, "transform") as string
              const matrix = new DOMMatrixReadOnly(transform)
              setPosition({ x: matrix.m41, y: matrix.m42 })
            }
          }
        })[0]
      }

      // Hover effect
      const currentPanel = panelRef.current
      if (!currentPanel) return

      const handleMouseEnter = () => {
        if (!isDragging) {
          gsap.to(currentPanel, {
            scale: 1.02,
            boxShadow: variant === 'neon' 
              ? '0 0 30px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(0, 255, 255, 0.15)'
              : '0 12px 48px rgba(0, 0, 0, 0.4)',
            duration: 0.3,
            ease: "power2.out"
          })
        }
      }

      const handleMouseLeave = () => {
        if (!isDragging) {
          gsap.to(currentPanel, {
            scale: 1,
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
            duration: 0.3,
            ease: "power2.out"
          })
        }
      }

      currentPanel.addEventListener('mouseenter', handleMouseEnter)
      currentPanel.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        currentPanel.removeEventListener('mouseenter', handleMouseEnter)
        currentPanel.removeEventListener('mouseleave', handleMouseLeave)
        if (draggableInstance.current) {
          draggableInstance.current.kill()
        }
      }
    }
  }, [isVisible, isDraggable, variant, isDragging, position])

  useEffect(() => {
    // Ensure panel stays within viewport bounds
    const updatePosition = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        const newX = Math.max(0, Math.min(position.x, viewportWidth - rect.width))
        const newY = Math.max(0, Math.min(position.y, viewportHeight - rect.height))
        
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY })
          gsap.set(panelRef.current, { x: newX, y: newY })
        }
      }
    }

    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [position])

  if (!isVisible) return null

  return (
    <div
      ref={panelRef}
      className={`
        ${styles.panelContainer}
        ${styles.panel}
        ${getVariantClass()}
        ${isDragging ? 'cursor-move' : 'cursor-auto'}
        ${className}
      `}
      // eslint-disable-next-line react/forbid-dom-props
      style={{
        width: size.width,
        height: isMinimized ? 'auto' : size.height,
        zIndex,
      }}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Move size={16} className="text-white/40" />
            <h3 className="text-sm font-medium text-white/90 font-display">
              {title}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
              onClick={(e) => {
                handleButtonClick(e.currentTarget)
                handleMinimize()
              }}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
              title="Minimize panel"
              aria-label="Minimize panel"
            >
              <Minimize2 size={14} />
            </button>
            <button
              onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
              onClick={(e) => {
                handleButtonClick(e.currentTarget)
                handleClose()
              }}
              className="p-1 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
              title="Close panel"
              aria-label="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`overflow-hidden ${isMinimized ? styles.contentHidden : styles.contentVisible}`}
      >
        <div className="p-4">
          {children}
        </div>
      </div>

      {/* Neon glow effect */}
      {variant === 'neon' && (
        <div className={`absolute inset-0 -z-10 opacity-50 ${styles.neonGlow}`} />
      )}

      {/* Liquid animation border for cyber variant */}
      {variant === 'cyber' && (
        <div className={`absolute inset-0 -z-10 animate-liquid opacity-30 ${styles.liquidBorder}`} />
      )}
    </div>
  )
}

export default FloatingPanel
