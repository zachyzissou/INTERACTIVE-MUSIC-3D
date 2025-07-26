"use client"
import React, { Suspense, useState, useCallback } from "react"
import dynamic from 'next/dynamic'

// Load the simplified working musical canvas component
const WorkingMusicalCanvas = dynamic(() => import('../src/components/SimpleWorkingCanvas'), { 
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#0f0f23',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ color: 'white', textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid transparent',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div>Loading Musical Interface...</div>
      </div>
    </div>
  )
})

// Simple start overlay
function StartOverlay({ onStart }: { onStart: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  
  const handleStart = async () => {
    setLoading(true)
    await onStart()
  }
  
  return (
    <div 
      data-testid="start-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '4rem',
            fontWeight: '100',
            background: 'linear-gradient(135deg, #4ade80, #3b82f6, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
            letterSpacing: '4px',
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 0 30px rgba(59, 130, 246, 0.3)'
          }}>
            SONIC CANVAS
          </div>
          <div style={{
            fontSize: '1.2rem',
            color: 'rgba(255,255,255,0.8)',
            fontWeight: '300',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}>
            Interactive 3D Music Experience
          </div>
        </div>
        
        <button
          data-testid="start-button"
          onClick={handleStart}
          disabled={loading}
          style={{
            padding: '20px 48px',
            background: loading ? 'rgba(59, 130, 246, 0.3)' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500',
            letterSpacing: '1px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none',
            opacity: loading ? 0.7 : 1,
            transform: loading ? 'scale(0.95)' : 'scale(1)',
            boxShadow: loading ? 'none' : '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></span>
              Initializing Audio...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚀 Enter Experience
            </span>
          )}
        </button>
        
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

export default function Home() {
  const [started, setStarted] = useState(false)

  const handleStart = useCallback(async () => {
    try {
      // Import and initialize audio system
      const { startAudio } = await import('../src/lib/audio/startAudio')
      await startAudio()
      setStarted(true)
      console.log('Audio system initialized successfully')
    } catch (error) {
      console.error('Failed to start audio:', error)
      // Still allow visual mode without audio
      setStarted(true)
      console.log('Running in visual-only mode')
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#0f0f23'
    }}>
      {!started && <StartOverlay onStart={handleStart} />}
      
      {started && (
        <div 
          id="main-content" 
          data-testid="main-content"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 10
          }}
        >
          <Suspense fallback={
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px'
            }}>
              Loading 3D Experience...
            </div>
          }>
            <WorkingMusicalCanvas />
          </Suspense>
        </div>
      )}
    </div>
  )
}