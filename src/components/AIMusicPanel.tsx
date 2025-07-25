/**
 * AI Music Generation Control Panel
 * Advanced interface for AI-powered music composition and real-time generation
 */

import React, { useState, useCallback, useMemo } from 'react'
import { useAIMusic } from '../hooks/useAIMusic'

interface AIMusicPanelProps {
  isVisible: boolean
  onToggle: () => void
}

export const AIMusicPanel: React.FC<AIMusicPanelProps> = ({ isVisible, onToggle }) => {
  const {
    isGenerating,
    error,
    currentComposition,
    generationHistory,
    generateComposition,
    generateRealtimeComposition,
    generateVariation,
    playComposition,
    clearError,
    getStats,
    isReady
  } = useAIMusic()

  const [generationSettings, setGenerationSettings] = useState({
    style: 'electronic' as const,
    temperature: 0.7,
    steps: 16,
    rhythmComplexity: 0.5,
    harmonicComplexity: 0.5,
    useAudioAnalysis: true
  })

  const stats = useMemo(() => getStats(), [getStats])

  const handleGenerate = useCallback(async () => {
    await generateComposition(generationSettings)
  }, [generateComposition, generationSettings])

  const handleRealtimeGenerate = useCallback(async () => {
    await generateRealtimeComposition(generationSettings)
  }, [generateRealtimeComposition, generationSettings])

  const handleVariation = useCallback(async () => {
    await generateVariation(undefined, 0.3)
  }, [generateVariation])

  const handlePlay = useCallback(() => {
    if (currentComposition) {
      playComposition(currentComposition)
    }
  }, [playComposition, currentComposition])

  const handleSettingChange = useCallback((key: string, value: any) => {
    setGenerationSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '280px',
      width: '320px',
      backgroundColor: 'rgba(15, 15, 35, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      padding: '20px',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '14px',
      zIndex: 1000,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            backgroundColor: isReady ? '#10b981' : '#f59e0b',
            borderRadius: '50%',
            boxShadow: `0 0 8px ${isReady ? '#10b981' : '#f59e0b'}`
          }}></span>
          <span style={{
            fontSize: '16px',
            fontWeight: '300',
            letterSpacing: '0.5px'
          }}>
            AI Music Studio
          </span>
        </div>
        <button
          onClick={onToggle}
          style={{
            background: 'none',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            color: 'white',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#fca5a5'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>Generation Error</div>
          <div>{error}</div>
          <button
            onClick={clearError}
            style={{
              marginTop: '8px',
              background: 'none',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              color: '#fca5a5',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Generation Controls */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '12px',
          opacity: 0.9
        }}>
          Generation Settings
        </div>

        {/* Style Selection */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            marginBottom: '6px',
            opacity: 0.8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Musical Style
          </label>
          <select
            value={generationSettings.style}
            onChange={(e) => handleSettingChange('style', e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: 'white',
              padding: '8px',
              fontSize: '12px'
            }}
          >
            <option value="classical">Classical</option>
            <option value="jazz">Jazz</option>
            <option value="electronic">Electronic</option>
            <option value="ambient">Ambient</option>
            <option value="experimental">Experimental</option>
          </select>
        </div>

        {/* Temperature Slider */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            marginBottom: '6px',
            opacity: 0.8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            <span>Creativity</span>
            <span>{generationSettings.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={generationSettings.temperature}
            onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              background: 'rgba(59, 130, 246, 0.3)',
              borderRadius: '2px',
              appearance: 'none',
              cursor: 'pointer'
            }}
          />
        </div>

        {/* Complexity Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              marginBottom: '4px',
              opacity: 0.8
            }}>
              Rhythm ({(generationSettings.rhythmComplexity * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={generationSettings.rhythmComplexity}
              onChange={(e) => handleSettingChange('rhythmComplexity', parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(34, 197, 94, 0.3)',
                borderRadius: '2px',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              marginBottom: '4px',
              opacity: 0.8
            }}>
              Harmony ({(generationSettings.harmonicComplexity * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={generationSettings.harmonicComplexity}
              onChange={(e) => handleSettingChange('harmonicComplexity', parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '3px',
                background: 'rgba(168, 85, 247, 0.3)',
                borderRadius: '2px',
                appearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>
        </div>

        {/* Audio Analysis Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <input
            type="checkbox"
            checked={generationSettings.useAudioAnalysis}
            onChange={(e) => handleSettingChange('useAudioAnalysis', e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label style={{
            fontSize: '11px',
            opacity: 0.8,
            cursor: 'pointer'
          }}>
            Audio-Reactive Generation
          </label>
        </div>
      </div>

      {/* Generation Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '20px'
      }}>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !isReady}
          style={{
            padding: '10px',
            backgroundColor: isGenerating ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '11px',
            fontWeight: '500',
            cursor: isGenerating || !isReady ? 'not-allowed' : 'pointer',
            opacity: isGenerating || !isReady ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isGenerating ? 'Generating...' : '🎵 Generate'}
        </button>
        <button
          onClick={handleRealtimeGenerate}
          disabled={isGenerating || !isReady}
          style={{
            padding: '10px',
            backgroundColor: isGenerating ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.8)',
            border: '1px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '11px',
            fontWeight: '500',
            cursor: isGenerating || !isReady ? 'not-allowed' : 'pointer',
            opacity: isGenerating || !isReady ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          🎤 Real-time
        </button>
      </div>

      {/* Current Composition */}
      {currentComposition && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              opacity: 0.9
            }}>
              Current Composition
            </span>
            <span style={{
              fontSize: '10px',
              opacity: 0.6
            }}>
              {currentComposition.generatedAt.toLocaleTimeString()}
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {['melody', 'harmony', 'rhythm', 'texture'].map(type => (
              <div
                key={type}
                style={{
                  padding: '4px',
                  backgroundColor: currentComposition[type as keyof typeof currentComposition] 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(107, 114, 128, 0.2)',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontSize: '9px',
                  textTransform: 'capitalize'
                }}
              >
                {type}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePlay}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              ▶ Play
            </button>
            <button
              onClick={handleVariation}
              disabled={isGenerating}
              style={{
                flex: 1,
                padding: '6px',
                backgroundColor: isGenerating ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '10px',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                opacity: isGenerating ? 0.6 : 1
              }}
            >
              🎲 Vary
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '500',
          marginBottom: '8px',
          opacity: 0.9
        }}>
          Session Statistics
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          fontSize: '10px',
          opacity: 0.8
        }}>
          <div>Generations: {stats.totalGenerations}</div>
          <div>Creativity: {stats.averageTemperature.toFixed(1)}</div>
        </div>
        {stats.totalGenerations > 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '9px',
            opacity: 0.6
          }}>
            Styles: {Object.entries(stats.styleDistribution).map(([style, count]) => 
              `${style} (${count})`
            ).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

export default AIMusicPanel