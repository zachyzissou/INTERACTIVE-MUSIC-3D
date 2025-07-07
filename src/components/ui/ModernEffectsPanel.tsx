'use client'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Waves, Grid, Layers, Palette, Star, Circle } from 'lucide-react'
import { useUIManager } from './UIManager'
import { useEffectSettings } from '@/store/useEffectSettings'
import FloatingPanel from './FloatingPanel'

interface EffectCardProps {
  readonly name: string
  readonly description: string
  readonly icon: React.ComponentType<{ size: number }>
  readonly isActive?: boolean
  readonly onClick: () => void
  readonly color: 'cyan' | 'pink' | 'purple' | 'orange' | 'green'
}

function EffectCard({ name, description, icon: Icon, isActive, onClick, color }: EffectCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'cyan': return 'from-neon-cyan/20 to-blue-500/20 border-neon-cyan/30 text-neon-cyan'
      case 'pink': return 'from-neon-pink/20 to-red-500/20 border-neon-pink/30 text-neon-pink'
      case 'purple': return 'from-neon-purple/20 to-purple-500/20 border-neon-purple/30 text-neon-purple'
      case 'orange': return 'from-neon-orange/20 to-yellow-500/20 border-neon-orange/30 text-neon-orange'
      case 'green': return 'from-neon-green/20 to-emerald-500/20 border-neon-green/30 text-neon-green'
      default: return 'from-neon-cyan/20 to-blue-500/20 border-neon-cyan/30 text-neon-cyan'
    }
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative p-4 rounded-xl border-2 bg-gradient-to-br transition-all duration-300
        ${isActive 
          ? `${getColorClasses()} shadow-lg` 
          : 'from-white/5 to-white/10 border-white/20 text-white/70 hover:border-white/40'
        }
      `}
    >
      <div className="flex flex-col items-center space-y-2">
        <Icon size={24} />
        <span className="font-medium text-sm">{name}</span>
        <span className="text-xs opacity-70 text-center">{description}</span>
      </div>
      
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent to-white/5 blur-sm"
        />
      )}
    </motion.button>
  )
}

export function ModernEffectsPanel() {
  const { registerPanel, unregisterPanel, visiblePanels, hidePanel } = useUIManager()
  const { setEffect, getParams } = useEffectSettings()
  const [activeEffect, setActiveEffect] = useState<string | null>(null)

  useEffect(() => {
    registerPanel({
      id: 'effectsPanel',
      title: 'Visual Effects',
      component: ModernEffectsPanel,
      defaultPosition: { x: 400, y: 100 },
      defaultSize: { width: 420, height: 600 },
      variant: 'cyber',
      isDraggable: true,
      isVisible: false,
    })

    return () => unregisterPanel('effectsPanel')
  }, [registerPanel, unregisterPanel])

  const isVisible = visiblePanels.has('effectsPanel')

  const effects = [
    {
      id: 'particles',
      name: 'Particles',
      description: 'Dynamic particle systems',
      icon: Sparkles,
      color: 'cyan' as const,
    },
    {
      id: 'lightning',
      name: 'Lightning',
      description: 'Electric visual effects',
      icon: Zap,
      color: 'purple' as const,
    },
    {
      id: 'waves',
      name: 'Audio Waves',
      description: 'Sound visualization',
      icon: Waves,
      color: 'pink' as const,
    },
    {
      id: 'grid',
      name: 'Cyber Grid',
      description: 'Futuristic grid overlay',
      icon: Grid,
      color: 'green' as const,
    },
    {
      id: 'layers',
      name: 'Depth Layers',
      description: 'Multi-dimensional depth',
      icon: Layers,
      color: 'orange' as const,
    },
    {
      id: 'chromatic',
      name: 'Chromatic',
      description: 'Color aberration effects',
      icon: Palette,
      color: 'cyan' as const,
    },
    {
      id: 'starburst',
      name: 'Starburst',
      description: 'Radial light bursts',
      icon: Star,
      color: 'purple' as const,
    },
    {
      id: 'orbs',
      name: 'Energy Orbs',
      description: 'Floating energy spheres',
      icon: Circle,
      color: 'pink' as const,
    },
  ]

  const handleEffectToggle = (effectId: string) => {
    if (activeEffect === effectId) {
      setActiveEffect(null)
      // Reset effect parameters to defaults
      setEffect(effectId, { reverb: 0, delay: 0, lowpass: 20000, highpass: 0 })
    } else {
      setActiveEffect(effectId)
      // Apply some default effect settings
      setEffect(effectId, { reverb: 0.3, delay: 0.2, lowpass: 15000, highpass: 100 })
    }
  }

  if (!isVisible) return null

  return (
    <FloatingPanel
      title="Visual Effects Studio"
      variant="cyber"
      defaultPosition={{ x: 400, y: 100 }}
      defaultSize={{ width: 420, height: 600 }}
      isVisible={isVisible}
      onVisibilityChange={(visible) => {
        if (!visible) {
          hidePanel('effectsPanel');
        }
      }}
    >
      <div className="space-y-6">
        {/* Effects Grid */}
        <div className="grid grid-cols-2 gap-4">
          {effects.map((effect) => (
            <EffectCard
              key={effect.id}
              name={effect.name}
              description={effect.description}
              icon={effect.icon}
              color={effect.color}
              isActive={activeEffect === effect.id}
              onClick={() => handleEffectToggle(effect.id)}
            />
          ))}
        </div>

        {/* Active Effect Controls */}
        <AnimatePresence>
          {activeEffect && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-lg bg-neon-purple/10 border border-neon-purple/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-neon-purple" />
                <span className="font-medium text-white/90">
                  {effects.find(e => e.id === activeEffect)?.name} Settings
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="effect-intensity" className="text-sm text-white/70 mb-1 block">Intensity</label>
                  <input
                    id="effect-intensity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    aria-label="Effect intensity"
                  />
                </div>
                <div>
                  <label htmlFor="effect-speed" className="text-sm text-white/70 mb-1 block">Speed</label>
                  <input
                    id="effect-speed"
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    defaultValue="1"
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    aria-label="Effect speed"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preset Combinations */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
            <Sparkles size={16} />
            Effect Presets
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            {['Cyberpunk', 'Ambient Dreams', 'Electric Storm', 'Cosmic Journey'].map((preset) => (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-left transition-all duration-200"
              >
                <span className="text-sm font-medium text-white/90">{preset}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Performance Info */}
        <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
          <div className="flex items-center gap-2 text-neon-cyan text-sm">
            <Circle size={8} className="animate-pulse" />
            <span>Real-time GPU acceleration active</span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}

export default ModernEffectsPanel
