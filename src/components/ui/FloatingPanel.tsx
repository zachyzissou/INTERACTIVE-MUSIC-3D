'use client'
import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { XMarkIcon, ArrowsPointingOutIcon, MinusIcon } from '@heroicons/react/24/outline'
import styles from './FloatingPanel.module.css'

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

  const getVariantClass = () => {
    switch (variant) {
      case 'glass': return styles.glassPanel
      case 'neon': return styles.neonPanel
      case 'cyber': return styles.cyberPanel
      case 'minimal': return styles.minimalPanel
      default: return styles.glassPanel
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
    setZIndex(1000) // Bring to front when dragging
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    setPosition(prev => ({
      x: prev.x + info.offset.x,
      y: prev.y + info.offset.y,
    }))
    setZIndex(10) // Reset z-index
  }

  const handleClose = () => {
    onVisibilityChange?.(false)
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  useEffect(() => {
    // Ensure panel stays within viewport bounds
    const updatePosition = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        setPosition(prev => ({
          x: Math.max(0, Math.min(prev.x, viewportWidth - rect.width)),
          y: Math.max(0, Math.min(prev.y, viewportHeight - rect.height)),
        }))
      }
    }

    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          x: position.x,
          y: position.y,
        }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        drag={isDraggable}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          fixed select-none overflow-hidden
          ${styles.panel}
          ${getVariantClass()}
          ${isDragging ? 'cursor-move' : 'cursor-auto'}
          ${className}
        `}
        style={{
          width: size.width,
          height: isMinimized ? 'auto' : size.height,
          zIndex,
        }}
        whileHover={{ 
          scale: isDragging ? 1 : 1.02,
          boxShadow: variant === 'neon' 
            ? '0 0 30px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(0, 255, 255, 0.15)'
            : '0 12px 48px rgba(0, 0, 0, 0.4)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <ArrowsPointingOutIcon className="w-4 h-4 text-white/40" />
              <h3 className="text-sm font-medium text-white/90 font-display">
                {title}
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleMinimize}
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
              >
                <MinusIcon className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-1 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        )}

        {/* Content */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Neon glow effect */}
        {variant === 'neon' && (
          <div className={`absolute inset-0 -z-10 opacity-50 ${styles.neonGlow}`} />
        )}

        {/* Liquid animation border for cyber variant */}
        {variant === 'cyber' && (
          <div className={`absolute inset-0 -z-10 animate-liquid opacity-30 ${styles.liquidBorder}`} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default FloatingPanel