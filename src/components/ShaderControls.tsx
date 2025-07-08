'use client'
import React, { useState, useEffect } from 'react'
import { gsap } from 'gsap'

interface ShaderControlsProps {
  activeShader: string
  onShaderChange: (shader: string) => void
  glitchIntensity: number
  onGlitchIntensityChange: (intensity: number) => void
  noiseScale?: number
  onNoiseScaleChange?: (scale: number) => void
  rippleIntensity?: number
  onRippleIntensityChange?: (intensity: number) => void
  audioReactivity?: number
  onAudioReactivityChange?: (reactivity: number) => void
  className?: string
}

interface ShaderPreset {
  name: string
  key: string
  description: string
  color: string
  icon: string
}

const SHADER_PRESETS: ShaderPreset[] = [
  {
    name: 'Metaball',
    key: 'metaball',
    description: 'Organic fluid blob animations',
    color: 'from-pink-500 to-purple-600',
    icon: '◉'
  },
  {
    name: 'Voronoi',
    key: 'voronoi', 
    description: 'Crystalline procedural patterns',
    color: 'from-cyan-400 to-blue-600',
    icon: '◇'
  },
  {
    name: 'Water Ripple',
    key: 'ripple',
    description: 'Realistic wave simulations', 
    color: 'from-blue-400 to-teal-500',
    icon: '〜'
  },
  {
    name: 'Neon Noise',
    key: 'neonNoise',
    description: 'Procedural noise with glow',
    color: 'from-green-400 to-emerald-600', 
    icon: '※'
  },
  {
    name: 'RGB Glitch',
    key: 'glitch',
    description: 'Digital corruption effects',
    color: 'from-red-500 to-orange-600',
    icon: '▣'
  }
]

export default function ShaderControls({
  activeShader,
  onShaderChange,
  glitchIntensity,
  onGlitchIntensityChange,
  noiseScale = 5.0,
  onNoiseScaleChange,
  rippleIntensity = 1.0,
  onRippleIntensityChange,
  audioReactivity = 1.0,
  onAudioReactivityChange,
  className = ''
}: ShaderControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [previewShader, setPreviewShader] = useState<string | null>(null)

  useEffect(() => {
    // Animate panel entrance
    gsap.fromTo('.shader-controls', 
      { x: -300, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.2)' }
    )
  }, [])

  const handleShaderSelect = (shaderKey: string) => {
    onShaderChange(shaderKey)
    setPreviewShader(null)
    
    // Animate selection
    gsap.to(`.shader-btn-${shaderKey}`, {
      scale: 1.1,
      duration: 0.1,
      yoyo: true,
      repeat: 1
    })
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    
    gsap.to('.shader-controls-content', {
      height: isExpanded ? 'auto' : 0,
      opacity: isExpanded ? 1 : 0,
      duration: 0.3,
      ease: 'power2.out'
    })
  }

  return (
    <div className={`shader-controls fixed left-4 top-1/2 transform -translate-y-1/2 z-30 ${className}`}>
      <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl max-w-sm">
        
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-2xl"
          onClick={toggleExpanded}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h3 className="text-white font-semibold">Shader Controls</h3>
              <p className="text-white/60 text-xs">Visual effects</p>
            </div>
          </div>
          
          <div className={`text-white/70 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </div>

        {/* Content */}
        <div className="shader-controls-content overflow-hidden">
          <div className="p-4 space-y-6">
            
            {/* Shader Presets */}
            <div>
              <h4 className="text-white/80 text-sm font-medium mb-3">Shader Presets</h4>
              <div className="grid grid-cols-1 gap-2">
                {SHADER_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    className={`shader-btn-${preset.key} group relative p-3 rounded-xl border transition-all duration-200 text-left
                      ${activeShader === preset.key 
                        ? 'border-white/30 bg-white/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                      }`}
                    onClick={() => handleShaderSelect(preset.key)}
                    onMouseEnter={() => setPreviewShader(preset.key)}
                    onMouseLeave={() => setPreviewShader(null)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-lg">{preset.icon}</span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{preset.name}</div>
                        <div className="text-white/60 text-xs truncate">{preset.description}</div>
                      </div>
                      
                      {/* Active indicator */}
                      {activeShader === preset.key && (
                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shader Parameters */}
            <div className="space-y-4">
              <h4 className="text-white/80 text-sm font-medium">Parameters</h4>
              
              {/* Glitch Intensity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-white/70 text-xs">Glitch Intensity</label>
                  <span className="text-cyan-400 text-xs font-mono">{glitchIntensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={glitchIntensity}
                  onChange={(e) => onGlitchIntensityChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>

              {/* Noise Scale */}
              {onNoiseScaleChange && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-white/70 text-xs">Noise Scale</label>
                    <span className="text-purple-400 text-xs font-mono">{noiseScale.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.1"
                    value={noiseScale}
                    onChange={(e) => onNoiseScaleChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              )}

              {/* Ripple Intensity */}
              {onRippleIntensityChange && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-white/70 text-xs">Ripple Intensity</label>
                    <span className="text-blue-400 text-xs font-mono">{rippleIntensity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value={rippleIntensity}
                    onChange={(e) => onRippleIntensityChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              )}

              {/* Audio Reactivity */}
              {onAudioReactivityChange && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-white/70 text-xs">Audio Reactivity</label>
                    <span className="text-pink-400 text-xs font-mono">{audioReactivity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.01"
                    value={audioReactivity}
                    onChange={(e) => onAudioReactivityChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              )}
            </div>

            {/* Preview indicator */}
            {previewShader && previewShader !== activeShader && (
              <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-yellow-300 text-xs">
                  Preview: {SHADER_PRESETS.find(p => p.key === previewShader)?.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(45deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
        }
      `}</style>
    </div>
  )
}