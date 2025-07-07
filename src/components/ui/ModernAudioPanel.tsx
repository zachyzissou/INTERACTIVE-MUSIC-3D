'use client'
import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Headphones, Sliders, Filter } from 'lucide-react'
import { useAudioSettings } from '@/store/useAudioSettings'
import { useUIManager } from './UIManager'
import FloatingPanel from './FloatingPanel'
import styles from './ModernAudioPanel.module.css'

interface ModernSliderProps {
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly onChange: (value: number) => void
  readonly icon?: React.ComponentType<{ size: number }>
  readonly unit?: string
  readonly color?: 'cyan' | 'pink' | 'purple' | 'orange'
}

function ModernSlider({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  icon: Icon, 
  unit = '',
  color = 'cyan' 
}: ModernSliderProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'cyan': return 'from-neon-cyan to-blue-400'
      case 'pink': return 'from-neon-pink to-red-400'
      case 'purple': return 'from-neon-purple to-purple-400'
      case 'orange': return 'from-neon-orange to-yellow-400'
      default: return 'from-neon-cyan to-blue-400'
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} />}
          <label className="text-sm font-medium text-white/90">{label}</label>
        </div>
        <span className="text-xs font-mono text-white/70">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer ${styles.slider} bg-gradient-to-r ${getColorClasses()}`}
          aria-label={label}
          title={`${label}: ${value.toFixed(step < 1 ? 2 : 0)}${unit}`}
        />
      </div>
    </div>
  )
}

export function ModernAudioPanel() {
  const { registerPanel, unregisterPanel, visiblePanels, hidePanel } = useUIManager()
  const {
    volume,
    setVolume,
    chorusDepth,
    setChorusDepth,
    delayFeedback,
    setDelayFeedback,
    reverbWet,
    setReverbWet,
    bitcrusherBits,
    setBitcrusherBits,
    filterFrequency,
    setFilterFrequency,
  } = useAudioSettings()

  useEffect(() => {
    registerPanel({
      id: 'audioSettings',
      title: 'Audio Settings',
      component: ModernAudioPanel,
      defaultPosition: { x: 50, y: 100 },
      defaultSize: { width: 350, height: 500 },
      variant: 'neon',
      isDraggable: true,
      isVisible: false,
    })

    return () => unregisterPanel('audioSettings')
  }, [registerPanel, unregisterPanel])

  const isVisible = visiblePanels.has('audioSettings')

  if (!isVisible) return null

  return (
    <FloatingPanel
      title="Audio Settings"
      variant="neon"
      defaultPosition={{ x: 50, y: 100 }}
      defaultSize={{ width: 350, height: 500 }}
      isVisible={isVisible}
      onVisibilityChange={(visible) => {
        if (!visible) {
          hidePanel('audioSettings');
        }
      }}
    >
      <div className="space-y-6">
        {/* Master Volume */}
        <div className="p-4 rounded-lg bg-white/5 border border-neon-cyan/20">
          <ModernSlider
            label="Master Volume"
            value={volume}
            min={0}
            max={1}
            step={0.01}
            onChange={setVolume}
            icon={Volume2}
            color="cyan"
          />
        </div>

        {/* Effects Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/90 font-medium">
            <Sliders size={18} />
            <span>Effects</span>
          </div>

          <div className="space-y-4">
            <ModernSlider
              label="Chorus Depth"
              value={chorusDepth}
              min={0}
              max={1}
              step={0.01}
              onChange={setChorusDepth}
              color="purple"
            />

            <ModernSlider
              label="Delay Feedback"
              value={delayFeedback}
              min={0}
              max={0.8}
              step={0.01}
              onChange={setDelayFeedback}
              color="pink"
            />

            <ModernSlider
              label="Reverb Wet"
              value={reverbWet}
              min={0}
              max={1}
              step={0.01}
              onChange={setReverbWet}
              color="cyan"
            />
          </div>
        </div>

        {/* Digital Effects */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white/90 font-medium">
            <Filter size={18} />
            <span>Digital</span>
          </div>

          <div className="space-y-4">
            <ModernSlider
              label="Bitcrusher"
              value={bitcrusherBits}
              min={1}
              max={16}
              step={1}
              onChange={setBitcrusherBits}
              unit=" bits"
              color="orange"
            />

            <ModernSlider
              label="Filter Frequency"
              value={filterFrequency}
              min={20}
              max={20000}
              step={1}
              onChange={setFilterFrequency}
              unit=" Hz"
              color="purple"
            />
          </div>
        </div>

        {/* Audio Info */}
        <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
          <div className="flex items-center gap-2 text-neon-cyan text-sm">
            <Headphones size={14} />
            <span>High-quality audio processing active</span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}

export default ModernAudioPanel
