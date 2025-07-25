'use client'
import { useState } from 'react'
import { useThemeSettings, VisualTheme } from '@/store/useThemeSettings'
import FloatingPanel from './FloatingPanel'
import LiquidButton from '../LiquidButton'
import Knob from '../JSAudioKnobs'

interface ThemeCustomizerProps {
  position?: [number, number, number]
  orbitRadius?: number
  orbitSpeed?: number
  theme?: 'cyber' | 'glass' | 'neon' | 'plasma'
  onClose?: () => void
}

export default function ThemeCustomizer({
  position = [3, -1, -2],
  orbitRadius = 0,
  orbitSpeed = 0,
  theme = 'plasma',
  onClose
}: ThemeCustomizerProps) {
  const {
    currentTheme,
    getCurrentConfig,
    getThemeList,
    setTheme,
    updateCustomSettings,
    resetToDefault,
    isCustomized
  } = useThemeSettings()

  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'effects' | 'materials'>('themes')
  const config = getCurrentConfig()
  const themes = getThemeList()

  const handleThemeChange = (themeId: VisualTheme) => {
    setTheme(themeId)
  }

  const handleColorChange = (colorKey: string, value: string) => {
    updateCustomSettings({
      colors: {
        ...config.colors,
        [colorKey]: value
      }
    })
  }

  const handleEffectChange = (effectKey: string, value: number | boolean) => {
    updateCustomSettings({
      effects: {
        ...config.effects,
        [effectKey]: value
      }
    })
  }

  const handleMaterialChange = (materialKey: string, value: string | number) => {
    updateCustomSettings({
      materials: {
        ...config.materials,
        [materialKey]: value
      }
    })
  }

  return (
    <FloatingPanel
      position={position}
      title="🎨 Theme Customizer"
      theme={theme}
      orbitRadius={orbitRadius}
      orbitSpeed={orbitSpeed}
      onClose={onClose}
      className="max-w-[400px]"
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white/10 rounded-lg p-1">
          {[
            { id: 'themes', label: '🎭', tooltip: 'Themes' },
            { id: 'colors', label: '🌈', tooltip: 'Colors' },
            { id: 'effects', label: '✨', tooltip: 'Effects' },
            { id: 'materials', label: '💎', tooltip: 'Materials' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-2 py-1 rounded text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              title={tab.tooltip}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Theme Selection */}
        {activeTab === 'themes' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold opacity-80">Select Theme</div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => (
                <LiquidButton
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  variant={currentTheme === t.id ? 'primary' : 'secondary'}
                  className={`px-3 py-2 text-xs ${
                    currentTheme === t.id ? 'ring-1 ring-current' : ''
                  }`}
                  style={{
                    '--button-color': t.colors.primary,
                    color: currentTheme === t.id ? t.colors.primary : undefined
                  } as any}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/30"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <div>{t.name}</div>
                  </div>
                </LiquidButton>
              ))}
            </div>
            
            {isCustomized && (
              <LiquidButton
                onClick={resetToDefault}
                variant="secondary"
                className="w-full px-3 py-2 text-xs"
              >
                🔄 Reset to Default
              </LiquidButton>
            )}
          </div>
        )}

        {/* Color Customization */}
        {activeTab === 'colors' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold opacity-80">Color Palette</div>
            {Object.entries(config.colors).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-xs capitalize opacity-80">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded border-2 border-white/20 bg-transparent cursor-pointer"
                  />
                  <div className="text-xs font-mono opacity-60 w-16">
                    {value.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Effects Customization */}
        {activeTab === 'effects' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold opacity-80">Visual Effects</div>
            
            <Knob
              label="Bloom"
              min={0}
              max={5}
              step={0.1}
              value={config.effects.bloomIntensity}
              onChange={(e) => handleEffectChange('bloomIntensity', parseFloat(e.target.value))}
            />
            
            <Knob
              label="Chromatic"
              min={0}
              max={0.01}
              step={0.0001}
              value={config.effects.chromaticAberration}
              onChange={(e) => handleEffectChange('chromaticAberration', parseFloat(e.target.value))}
            />
            
            <Knob
              label="Particles"
              min={0}
              max={5}
              step={0.1}
              value={config.effects.particleIntensity}
              onChange={(e) => handleEffectChange('particleIntensity', parseFloat(e.target.value))}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.effects.glitchEnabled}
                onChange={(e) => handleEffectChange('glitchEnabled', e.target.checked)}
                className="w-4 h-4 rounded border-2 border-current bg-transparent checked:bg-current"
              />
              <span>Enable Glitch Effects</span>
            </label>
          </div>
        )}

        {/* Materials Customization */}
        {activeTab === 'materials' && (
          <div className="space-y-3">
            <div className="text-sm font-semibold opacity-80">Material Properties</div>
            
            <div className="space-y-2">
              <label className="text-xs opacity-80">Default Material</label>
              <select
                value={config.materials.default}
                onChange={(e) => handleMaterialChange('default', e.target.value)}
                className="w-full text-black rounded px-2 py-1 text-xs bg-white/90"
              >
                <option value="cymatic">Cymatic</option>
                <option value="holographic">Holographic</option>
                <option value="liquid-metal">Liquid Metal</option>
                <option value="plasma">Plasma</option>
                <option value="crystal">Crystal</option>
              </select>
            </div>

            <Knob
              label="Metalness"
              min={0}
              max={1}
              step={0.01}
              value={config.materials.metalness}
              onChange={(e) => handleMaterialChange('metalness', parseFloat(e.target.value))}
            />
            
            <Knob
              label="Roughness"
              min={0}
              max={1}
              step={0.01}
              value={config.materials.roughness}
              onChange={(e) => handleMaterialChange('roughness', parseFloat(e.target.value))}
            />
            
            <Knob
              label="Transmission"
              min={0}
              max={1}
              step={0.01}
              value={config.materials.transmission}
              onChange={(e) => handleMaterialChange('transmission', parseFloat(e.target.value))}
            />
          </div>
        )}

        {/* Export/Import */}
        <div className="pt-2 border-t border-white/20">
          <div className="flex gap-2">
            <LiquidButton
              onClick={() => {
                const data = JSON.stringify(config, null, 2)
                navigator.clipboard.writeText(data)
              }}
              variant="secondary"
              className="px-3 py-1 text-xs flex-1"
            >
              📋 Copy
            </LiquidButton>
            
            <LiquidButton
              onClick={() => {
                const link = document.createElement('a')
                const data = JSON.stringify(config, null, 2)
                const blob = new Blob([data], { type: 'application/json' })
                link.href = URL.createObjectURL(blob)
                link.download = `theme-${config.name.toLowerCase()}.json`
                link.click()
              }}
              variant="secondary"
              className="px-3 py-1 text-xs flex-1"
            >
              💾 Export
            </LiquidButton>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="pt-2 border-t border-white/20 text-xs opacity-60">
          <div className="flex justify-between">
            <span>Current:</span>
            <span className="capitalize">{config.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isCustomized ? 'text-yellow-400' : 'text-green-400'}>
              {isCustomized ? 'Customized' : 'Default'}
            </span>
          </div>
        </div>
      </div>
    </FloatingPanel>
  )
}