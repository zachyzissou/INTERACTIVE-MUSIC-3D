'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Volume2, Layers, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react'
import { useUIManager } from './UIManager'
import FloatingPanel from './FloatingPanel'

interface ControlBarProps {
  readonly position?: 'top' | 'bottom' | 'left' | 'right'
  readonly variant?: 'minimal' | 'glass' | 'neon'
}

export function ModernControlBar({ position = 'bottom', variant = 'glass' }: ControlBarProps) {
  const { isImmersiveMode, setImmersiveMode, togglePanel, hideAllPanels, showAllPanels } = useUIManager()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleImmersiveToggle = () => {
    setImmersiveMode(!isImmersiveMode)
    if (!isImmersiveMode) {
      hideAllPanels()
    } else {
      showAllPanels()
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2'
      case 'bottom':
        return 'bottom-4 left-1/2 -translate-x-1/2'
      case 'left':
        return 'left-4 top-1/2 -translate-y-1/2 flex-col'
      case 'right':
        return 'right-4 top-1/2 -translate-y-1/2 flex-col'
      default:
        return 'bottom-4 left-1/2 -translate-x-1/2'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-black/20 border-white/10'
      case 'glass':
        return 'bg-white/10 border-white/20'
      case 'neon':
        return 'bg-dark-500/60 border-neon-cyan/30 shadow-[0_0_20px_rgba(0,255,255,0.2)]'
      default:
        return 'bg-white/10 border-white/20'
    }
  }

  const controls = [
    { id: 'audio', icon: Volume2, label: 'Audio Settings', panel: 'audioSettings' },
    { id: 'effects', icon: Layers, label: 'Effects', panel: 'effectsPanel' },
    { id: 'settings', icon: Settings, label: 'Settings', panel: 'settingsPanel' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isImmersiveMode ? 0.3 : 1, 
        y: 0,
        scale: isImmersiveMode ? 0.8 : 1 
      }}
      whileHover={{ 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.2 }
      }}
      className={`
        fixed z-50 flex items-center gap-2 p-3 rounded-2xl
        border backdrop-blur-md transition-all duration-300
        ${getPositionClasses()}
        ${getVariantClasses()}
        ${isExpanded ? 'px-6' : 'px-3'}
      `}
    >
      {/* Immersive Mode Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleImmersiveToggle}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${isImmersiveMode 
            ? 'bg-neon-cyan/20 text-neon-cyan' 
            : 'hover:bg-white/10 text-white/70 hover:text-white'
          }
        `}
        title={isImmersiveMode ? 'Exit Immersive Mode' : 'Enter Immersive Mode'}
      >
        {isImmersiveMode ? <Eye size={18} /> : <EyeOff size={18} />}
      </motion.button>

      {/* Expand/Collapse Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </motion.button>

      {/* Control Buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="w-px h-6 bg-white/20 mx-1" />
            {controls.map((control) => (
              <motion.button
                key={control.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePanel(control.panel)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200"
                title={control.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: controls.indexOf(control) * 0.1 }}
              >
                <control.icon size={18} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glow effect for neon variant */}
      {variant === 'neon' && (
        <div className="absolute inset-0 -z-10 rounded-2xl bg-neon-cyan/5 blur-xl" />
      )}
    </motion.div>
  )
}

export default ModernControlBar
