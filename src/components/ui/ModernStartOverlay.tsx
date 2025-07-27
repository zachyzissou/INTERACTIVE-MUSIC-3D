'use client'
import { useState, useEffect } from 'react'
import { GlassPanel, NeonButton } from './ModernUITheme'
import { Music, Mouse, Keyboard, Smartphone, Volume2, Info } from 'lucide-react'
import gsap from 'gsap'
import { startAudioContext } from '@/lib/audio'

const shortcuts = [
  { key: 'Space', action: 'Play/Pause' },
  { key: '1-8', action: 'Select shape' },
  { key: 'Q/W/E/R', action: 'Change sound type' },
  { key: 'A/D', action: 'Previous/Next shape' },
  { key: 'Shift + Click', action: 'Multi-select' },
  { key: 'Delete', action: 'Remove shape' },
  { key: 'Ctrl/Cmd + S', action: 'Save session' },
  { key: 'H', action: 'Toggle help' },
]

export default function ModernStartOverlay() {
  const [isVisible, setIsVisible] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  
  useEffect(() => {
    // Check if user has seen overlay before
    const hasSeenOverlay = localStorage.getItem('hasSeenOverlay')
    if (hasSeenOverlay === 'true') {
      setIsVisible(false)
    }
    
    // Keyboard shortcut handler
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        setShowHelp(!showHelp)
      }
      if (e.key === 'Escape') {
        setShowHelp(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showHelp])
  
  const handleStart = async () => {
    // Initialize audio context
    await startAudioContext()
    
    // Animate out
    const overlay = document.getElementById('start-overlay')
    if (overlay) {
      gsap.to(overlay, {
        opacity: 0,
        scale: 0.9,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => {
          setIsVisible(false)
          setHasInteracted(true)
          localStorage.setItem('hasSeenOverlay', 'true')
        }
      })
    }
  }
  
  if (!isVisible && !showHelp) return null
  
  return (
    <div
      id="start-overlay"
      data-testid="start-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && hasInteracted) {
          setShowHelp(false)
        }
      }}
    >
      <GlassPanel
        variant="neon"
        className="max-w-2xl w-full max-h-[90vh] mx-4 p-4 md:p-8 animate-in fade-in zoom-in duration-500 overflow-y-auto"
        glow
      >
        {!hasInteracted ? (
          // Welcome Screen
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <Music className="w-16 h-16 md:w-24 md:h-24 text-cyan-400" />
                <div className="absolute inset-0 animate-ping">
                  <Music className="w-16 h-16 md:w-24 md:h-24 text-cyan-400 opacity-50" />
                </div>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Interactive 3D Music Experience
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-4">
              Create immersive music in a 3D space with AI-powered composition
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                <Mouse className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <h3 className="font-semibold text-white mb-1 text-sm">Click & Drag</h3>
                <p className="text-xs text-white/60">
                  Click shapes to play sounds, drag to move camera
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                <Keyboard className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <h3 className="font-semibold text-white mb-1 text-sm">Keyboard Control</h3>
                <p className="text-xs text-white/60">
                  Use shortcuts for quick actions (Press H for help)
                </p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                <Smartphone className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                <h3 className="font-semibold text-white mb-1 text-sm">Touch Friendly</h3>
                <p className="text-xs text-white/60">
                  Fully responsive with touch gestures support
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <NeonButton
                variant="primary"
                size="lg"
                onClick={handleStart}
                className="min-w-[200px]"
                data-testid="start-button"
              >
                <Volume2 className="w-5 h-5 mr-2 inline" />
                Start Creating
              </NeonButton>
              
              <button
                onClick={() => setShowHelp(true)}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                View keyboard shortcuts →
              </button>
            </div>
          </div>
        ) : (
          // Help Screen
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Info className="w-6 h-6 mr-2 text-cyan-400" />
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-white/60 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3 backdrop-blur-sm"
                >
                  <kbd className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-cyan-400">
                    {shortcut.key}
                  </kbd>
                  <span className="text-white/80 ml-3">{shortcut.action}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-white/60 text-center">
                Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd> or click outside to close
              </p>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}