'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'

interface LiquidButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'accent'
  className?: string
}

export function LiquidButton({ children, onClick, variant = 'primary', className = '' }: LiquidButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const variants = {
    primary: 'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500',
    secondary: 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
    accent: 'bg-gradient-to-br from-orange-500 via-yellow-500 to-pink-500'
  }

  const liquidSpring = useSpring({
    scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
    rotateZ: isHovered ? Math.sin(Date.now() * 0.001) * 2 : 0,
    config: { tension: 300, friction: 20 }
  })

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    const newRipple = { id: Date.now(), x, y }
    setRipples(prev => [...prev, newRipple])
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.()
  }

  return (
    <animated.button
      style={liquidSpring}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={handleClick}
      className={`
        relative overflow-hidden px-6 py-3 rounded-full
        ${variants[variant]}
        text-white font-semibold shadow-lg backdrop-blur-sm
        transition-all duration-200 ease-out
        before:absolute before:inset-0 before:bg-white before:opacity-20 before:blur-xl
        ${className}
      `}
    >
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Liquid ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute w-4 h-4 bg-white rounded-full pointer-events-none"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Liquid blob background */}
      <div className="absolute inset-0 opacity-30">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <filter id="liquid-filter">
              <feTurbulence
                baseFrequency="0.02"
                numOctaves="3"
                seed="5"
                stitchTiles="stitch"
              />
              <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
              <feComponentTransfer>
                <feFuncA type="discrete" tableValues="0 .5 .5 .7 .8 .9 1" />
              </feComponentTransfer>
            </filter>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="white"
            filter="url(#liquid-filter)"
            className="animate-pulse"
          />
        </svg>
      </div>
    </animated.button>
  )
}

export default LiquidButton
