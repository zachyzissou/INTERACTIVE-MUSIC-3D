'use client'
import React, { useState } from 'react'
import { useMusicalPalette, MusicalKey, MusicalScale } from '@/store/useMusicalPalette'

const keys: MusicalKey[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const scales: MusicalScale[] = ['major', 'minor', 'pentatonic', 'blues']

export default function ElegantMusicalControls() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { key, scale, tempo, setKey, setScale, setTempo } = useMusicalPalette()

  return (
    <>
      {/* Minimal floating control inspired by georgeandjonathan.com */}
      <div 
        style={{
          position: 'fixed',
          top: '30px',
          right: '30px',
          zIndex: 1000,
          fontFamily: 'system-ui, sans-serif',
          color: 'rgba(255,255,255,0.9)'
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50px',
            padding: '12px 20px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: '13px',
            fontWeight: '300',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.3)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          {key} {scale} · {tempo}
        </button>
        
        {/* Elegant expanded panel */}
        {isExpanded && (
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: '0',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '24px',
              minWidth: '280px',
              animation: 'fadeInScale 0.3s ease-out',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            {/* Key Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '400',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                opacity: 0.7,
                marginBottom: '8px'
              }}>
                Key
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '8px'
              }}>
                {keys.map(k => (
                  <button
                    key={k}
                    onClick={() => setKey(k)}
                    style={{
                      background: key === k ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '8px 4px',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '12px',
                      fontWeight: key === k ? '500' : '300',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (key !== k) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (key !== k) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '400',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                opacity: 0.7,
                marginBottom: '8px'
              }}>
                Scale
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {scales.map(s => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    style={{
                      background: scale === s ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px',
                      color: 'rgba(255,255,255,0.9)',
                      fontSize: '12px',
                      fontWeight: scale === s ? '500' : '300',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => {
                      if (scale !== s) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (scale !== s) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      }
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Tempo Control */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '400',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                opacity: 0.7,
                marginBottom: '8px'
              }}>
                Tempo {tempo}
              </label>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '2px',
                  background: 'rgba(255,255,255,0.2)',
                  outline: 'none',
                  borderRadius: '2px',
                  appearance: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          background: white;
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          background: white;
          transform: scale(1.2);
        }
      `}</style>
    </>
  )
}