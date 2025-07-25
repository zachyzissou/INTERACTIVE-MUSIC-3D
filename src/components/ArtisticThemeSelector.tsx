'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { useArtisticTheme, artisticThemes, type ArtisticTheme } from '../store/useArtisticTheme'
import { useMusicalPalette } from '../store/useMusicalPalette'

// Theme preview card component
function ThemePreviewCard({ 
  theme, 
  config, 
  isActive, 
  onClick 
}: {
  theme: ArtisticTheme
  config: any
  isActive: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '120px',
        height: '80px',
        borderRadius: '12px',
        border: `2px solid ${isActive ? config.colors.primary : 'rgba(255, 255, 255, 0.2)'}`,
        background: `linear-gradient(135deg, ${config.colors.primary}20, ${config.colors.secondary}20)`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isActive 
          ? `0 0 20px ${config.colors.primary}60` 
          : hovered 
            ? `0 0 15px ${config.colors.primary}40`
            : 'none'
      }}
    >
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '10px',
        background: `radial-gradient(circle at 30% 30%, ${config.colors.accent}40, transparent 60%), radial-gradient(circle at 70% 70%, ${config.colors.secondary}30, transparent 50%)`,
        opacity: hovered ? 0.8 : 0.5,
        transition: 'opacity 0.3s ease'
      }} />
      
      {/* Theme name */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        right: '8px',
        fontSize: '10px',
        fontWeight: '600',
        color: 'white',
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
        lineHeight: '1.2'
      }}>
        {config.name}
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: config.colors.primary,
          boxShadow: `0 0 8px ${config.colors.primary}`
        }} />
      )}
    </div>
  )
}

// Customization sliders
function CustomizationPanel() {
  const { getCurrentConfig, updateCustomParams, customParams } = useArtisticTheme()
  const config = getCurrentConfig()
  
  const sliders = [
    { key: 'viscosity', label: 'Viscosity', min: 0.1, max: 5.0, step: 0.1 },
    { key: 'wobbliness', label: 'Wobbliness', min: 0.1, max: 5.0, step: 0.1 },
    { key: 'distortion', label: 'Distortion', min: 0.0, max: 5.0, step: 0.1 },
    { key: 'glowIntensity', label: 'Glow', min: 0.5, max: 5.0, step: 0.1 },
    { key: 'particleDensity', label: 'Particles', min: 0.1, max: 3.0, step: 0.1 },
    { key: 'waveAmplitude', label: 'Waves', min: 0.1, max: 3.0, step: 0.1 }
  ]
  
  return (
    <div style={{
      display: 'grid',
      gap: '12px',
      padding: '16px',
      background: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: config.colors.primary,
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        ⚙️ Artistic Parameters
      </div>
      
      {sliders.map(slider => {
        const currentValue = customParams[slider.key as keyof typeof customParams] ?? 
                           config.shaderParams[slider.key as keyof typeof config.shaderParams]
        
        return (
          <div key={slider.key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.8)',
              minWidth: '60px'
            }}>
              {slider.label}
            </span>
            
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={currentValue}
              onChange={(e) => updateCustomParams({
                [slider.key]: parseFloat(e.target.value)
              })}
              style={{
                flex: 1,
                height: '4px',
                background: `linear-gradient(90deg, ${config.colors.secondary}, ${config.colors.primary})`,
                borderRadius: '2px',
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
            
            <span style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.6)',
              minWidth: '30px',
              textAlign: 'right'
            }}>
              {currentValue.toFixed(1)}
            </span>
          </div>
        )
      })}
      
      <button
        onClick={() => useArtisticTheme.getState().resetCustomParams()}
        style={{
          marginTop: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
        }}
      >
        Reset to Default
      </button>
    </div>
  )
}

// Musical sync indicator
function MusicalSyncIndicator() {
  const { key, scale } = useMusicalPalette()
  const { getCurrentConfig } = useArtisticTheme()
  const config = getCurrentConfig()
  
  // Auto-suggest themes based on musical key/scale
  const suggestedTheme = useMemo(() => {
    const keyMap: Record<string, ArtisticTheme> = {
      'C': 'cosmic-blobs',
      'C#': 'neural-network', 
      'D': 'organic-growth',
      'D#': 'crystal-resonance',
      'E': 'aquatic-fluidity',
      'F': 'organic-growth',
      'F#': 'retro-chiptune',
      'G': 'cosmic-blobs',
      'G#': 'neural-network',
      'A': 'aquatic-fluidity',
      'A#': 'retro-chiptune',
      'B': 'crystal-resonance'
    }
    
    const scaleModifier = scale === 'minor' ? 1 : scale === 'blues' ? 2 : 0
    const themes = Object.keys(artisticThemes) as ArtisticTheme[]
    const baseIndex = themes.indexOf(keyMap[key] || 'cosmic-blobs')
    
    return themes[(baseIndex + scaleModifier) % themes.length]
  }, [key, scale])
  
  return (
    <div style={{
      padding: '12px',
      background: 'rgba(0, 0, 0, 0.4)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontSize: '11px',
      color: 'rgba(255, 255, 255, 0.8)'
    }}>
      <div style={{ marginBottom: '6px' }}>
        🎵 <strong>{key} {scale}</strong> suggests:
      </div>
      <div style={{
        color: config.colors.primary,
        fontWeight: '500'
      }}>
        {artisticThemes[suggestedTheme].name}
      </div>
    </div>
  )
}

// Main theme selector component
export default function ArtisticThemeSelector({ 
  isVisible, 
  onClose 
}: { 
  isVisible: boolean
  onClose: () => void 
}) {
  const { currentTheme, setTheme, isTransitioning, transitionProgress } = useArtisticTheme()
  const [showCustomization, setShowCustomization] = useState(false)
  
  // Auto-hide after inactivity
  useEffect(() => {
    if (!isVisible) return
    
    const timeout = setTimeout(() => {
      onClose()
    }, 15000) // Auto-hide after 15 seconds
    
    return () => clearTimeout(timeout)
  }, [isVisible, onClose])
  
  if (!isVisible) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(15, 15, 35, 0.95)',
      backdropFilter: 'blur(30px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
      padding: '24px',
      color: 'white',
      fontFamily: 'system-ui, sans-serif',
      zIndex: 3000,
      minWidth: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto',
      animation: 'slideInScale 0.4s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '300',
            background: 'linear-gradient(135deg, #4ade80, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🎨 Artistic Themes
          </h2>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            opacity: 0.7
          }}>
            Transform your musical canvas with immersive visual themes
          </p>
        </div>
        
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Theme Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {Object.entries(artisticThemes).map(([themeKey, config]) => (
          <ThemePreviewCard
            key={themeKey}
            theme={themeKey as ArtisticTheme}
            config={config}
            isActive={currentTheme === themeKey && !isTransitioning}
            onClick={() => setTheme(themeKey as ArtisticTheme)}
          />
        ))}
      </div>
      
      {/* Transition progress */}
      {isTransitioning && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '8px'
          }}>
            ✨ Transitioning theme... {Math.round(transitionProgress * 100)}%
          </div>
          <div style={{
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${transitionProgress * 100}%`,
              background: 'linear-gradient(90deg, #4ade80, #3b82f6)',
              borderRadius: '2px',
              transition: 'width 0.1s ease'
            }} />
          </div>
        </div>
      )}
      
      {/* Bottom panel */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <MusicalSyncIndicator />
        </div>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <button
            onClick={() => setShowCustomization(!showCustomization)}
            style={{
              width: '100%',
              padding: '12px',
              background: showCustomization 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!showCustomization) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              if (!showCustomization) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            ⚙️ {showCustomization ? 'Hide' : 'Show'} Customization
          </button>
        </div>
      </div>
      
      {/* Customization panel */}
      {showCustomization && (
        <div style={{ marginTop: '16px' }}>
          <CustomizationPanel />
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  )
}