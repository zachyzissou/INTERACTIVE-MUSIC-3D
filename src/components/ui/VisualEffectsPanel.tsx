'use client'
import { useState, useCallback } from 'react'
import { useAudioStore } from '@/store/useAudioEngine'
import FloatingPanel from './FloatingPanel'
import LiquidButton from '../LiquidButton'
import Knob from '../JSAudioKnobs'

interface VisualEffectsPanelProps {
  position?: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  onClose?: () => void
  onThemeChange?: (theme: string) => void
  onEffectToggle?: (effect: string, enabled: boolean) => void
}

export default function VisualEffectsPanel({
  position = [-2, 0.5, -3],
  orbitRadius = 0,
  orbitSpeed = 0,
  theme = 'neon',
  onClose,
  onThemeChange,
  onEffectToggle
}: VisualEffectsPanelProps) {
  const { fftData, volume } = useAudioStore()
  const [selectedTheme, setSelectedTheme] = useState('ethereal')
  const [particleIntensity, setParticleIntensity] = useState(1.0)
  const [bloomIntensity, setBloomIntensity] = useState(2.2)
  const [chromaticAberration, setChromaticAberration] = useState(0.002)
  const [postProcessingEnabled, setPostProcessingEnabled] = useState(true)
  const [particlesEnabled, setParticlesEnabled] = useState(true)
  const [trailsEnabled, setTrailsEnabled] = useState(true)

  const themes = [
    { id: 'cyberpunk', name: 'Cyberpunk', color: '#00ffff' },
    { id: 'organic', name: 'Organic', color: '#00ff88' },
    { id: 'crystal', name: 'Crystal', color: '#ffffff' },
    { id: 'plasma', name: 'Plasma', color: '#ff00ff' },
    { id: 'ethereal', name: 'Ethereal', color: '#88aaff' },
  ]

  const effects = [
    { id: 'particles', name: 'Particles', enabled: particlesEnabled, setter: setParticlesEnabled },
    { id: 'postprocess', name: 'Post-FX', enabled: postProcessingEnabled, setter: setPostProcessingEnabled },
    { id: 'trails', name: 'Trails', enabled: trailsEnabled, setter: setTrailsEnabled },
  ]

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    if (onThemeChange) onThemeChange(themeId)
  }

  const handleEffectToggle = (effectId: string, enabled: boolean) => {
    effects.find(e => e.id === effectId)?.setter(enabled)
    if (onEffectToggle) onEffectToggle(effectId, enabled)
  }

  // Audio reactivity visualization
  const audioLevel = fftData && fftData.length > 0 
    ? fftData.reduce((a, b) => a + b, 0) / fftData.length / 255 
    : 0

  return (
    <FloatingPanel
      position={position}
      title="🎨 Visual Effects"
      theme={theme}
      orbitRadius={orbitRadius}
      orbitSpeed={orbitSpeed}
      onClose={onClose}
      className="max-w-[360px]"
    >
      <div className="space-y-4">
        {/* Audio Reactivity Indicator */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/20">
          <div className="text-sm font-semibold mb-2">Audio Analysis</div>
          <div className="flex items-center gap-2">
            <div className="text-xs">Level:</div>
            <div className="flex-1 h-2 bg-white/20 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-100"
                style={{ width: `${audioLevel * 100}%` }}
              />
            </div>
            <div className="text-xs w-10 text-right">{Math.round(audioLevel * 100)}%</div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Visual Theme</div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <LiquidButton
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                variant={selectedTheme === t.id ? 'primary' : 'secondary'}
                className={`px-3 py-2 text-xs ${
                  selectedTheme === t.id ? 'ring-1 ring-current' : ''
                }`}
                style={{
                  '--button-color': t.color,
                  color: selectedTheme === t.id ? t.color : undefined
                } as any}
              >
                {t.name}
              </LiquidButton>
            ))}
          </div>
        </div>

        {/* Effect Toggles */}
        <div className="space-y-2">
          <div className="text-sm font-semibold opacity-80">Effects</div>
          <div className="grid grid-cols-3 gap-2">
            {effects.map((effect) => (
              <LiquidButton
                key={effect.id}
                onClick={() => handleEffectToggle(effect.id, !effect.enabled)}
                variant={effect.enabled ? 'accent' : 'secondary'}
                className="px-2 py-2 text-xs"
              >
                <div className="flex flex-col items-center gap-1">
                  <div>{effect.enabled ? '✓' : '×'}</div>
                  <div>{effect.name}</div>
                </div>
              </LiquidButton>
            ))}
          </div>
        </div>

        {/* Intensity Controls */}
        <div className="space-y-3">
          <div className="text-sm font-semibold opacity-80">Intensity Controls</div>
          
          <div className="grid grid-cols-1 gap-3">
            <Knob
              label="Particles"
              min={0}
              max={3}
              step={0.1}
              value={particleIntensity}
              onChange={(e) => setParticleIntensity(parseFloat(e.target.value))}
              disabled={!particlesEnabled}
            />
            
            <Knob
              label="Bloom"
              min={0}
              max={5}
              step={0.1}
              value={bloomIntensity}
              onChange={(e) => setBloomIntensity(parseFloat(e.target.value))}
              disabled={!postProcessingEnabled}
            />
            
            <Knob
              label="Chromatic"
              min={0}
              max={0.01}
              step={0.0001}
              value={chromaticAberration}
              onChange={(e) => setChromaticAberration(parseFloat(e.target.value))}
              disabled={!postProcessingEnabled}
            />
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="pt-2 border-t border-white/20 text-xs opacity-60">
          <div className="flex justify-between">
            <span>Theme:</span>
            <span>{themes.find(t => t.id === selectedTheme)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Active FX:</span>
            <span>{effects.filter(e => e.enabled).length}/3</span>
          </div>
          <div className="flex justify-between">
            <span>Audio Input:</span>
            <span className={`${audioLevel > 0.1 ? 'text-green-400' : 'text-red-400'}`}>
              {audioLevel > 0.1 ? 'ACTIVE' : 'SILENT'}
            </span>
          </div>
        </div>

        {/* Preset Actions */}
        <div className="flex gap-2 pt-2 border-t border-white/20">
          <LiquidButton
            onClick={() => {
              setParticleIntensity(3.0)
              setBloomIntensity(5.0)
              setChromaticAberration(0.008)
              setSelectedTheme('cyberpunk')
              handleThemeChange('cyberpunk')
            }}
            variant="secondary"
            className="px-3 py-1 text-xs flex-1"
          >
            🚀 Max
          </LiquidButton>
          
          <LiquidButton
            onClick={() => {
              setParticleIntensity(1.0)
              setBloomIntensity(2.0)
              setChromaticAberration(0.002)
              setSelectedTheme('ethereal')
              handleThemeChange('ethereal')
            }}
            variant="secondary"
            className="px-3 py-1 text-xs flex-1"
          >
            ⚖️ Balanced
          </LiquidButton>
          
          <LiquidButton
            onClick={() => {
              setParticleIntensity(0.5)
              setBloomIntensity(1.0)
              setChromaticAberration(0.001)
              setSelectedTheme('organic')
              handleThemeChange('organic')
            }}
            variant="secondary"
            className="px-3 py-1 text-xs flex-1"
          >
            🍃 Eco
          </LiquidButton>
        </div>
      </div>
    </FloatingPanel>
  )
}