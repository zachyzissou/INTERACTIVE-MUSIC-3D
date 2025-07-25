'use client'
import { useEffect, useState } from 'react'
import { useAudioStore } from '@/store/useAudioEngine'

interface AccessibilityProps {
  highContrast?: boolean
  reducedMotion?: boolean
  audioDescription?: boolean
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilityProps>({
    highContrast: false,
    reducedMotion: false,
    audioDescription: false
  })

  useEffect(() => {
    // Detect system preferences
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    setSettings({
      highContrast: highContrastQuery.matches,
      reducedMotion: reducedMotionQuery.matches,
      audioDescription: false
    })

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, highContrast: e.matches }))
    }

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reducedMotion: e.matches }))
    }

    highContrastQuery.addEventListener('change', handleContrastChange)
    reducedMotionQuery.addEventListener('change', handleMotionChange)

    return () => {
      highContrastQuery.removeEventListener('change', handleContrastChange)
      reducedMotionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Apply accessibility CSS classes
  useEffect(() => {
    const classes = []
    if (settings.highContrast) classes.push('high-contrast')
    if (settings.reducedMotion) classes.push('reduced-motion')

    document.body.className = classes.join(' ')
  }, [settings])

  return (
    <>
      {children}
      <AccessibilityPanel settings={settings} setSettings={setSettings} />
      <style jsx global>{`
        .high-contrast {
          --bg-opacity: 1;
          --text-contrast: 2;
          --border-contrast: 1.5;
        }
        
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .screen-reader-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </>
  )
}

function AccessibilityPanel({ 
  settings, 
  setSettings 
}: { 
  settings: AccessibilityProps
  setSettings: (settings: AccessibilityProps) => void 
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Accessibility toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full
                   shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Accessibility Settings"
        title="Accessibility Settings"
      >
        ♿
      </button>

      {/* Accessibility panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 bg-white text-black p-4 rounded-lg
                        shadow-xl border border-gray-300 min-w-[250px]">
          <h3 className="font-bold mb-3">Accessibility Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => setSettings({
                  ...settings,
                  highContrast: e.target.checked
                })}
                className="w-4 h-4"
              />
              <span>High Contrast Mode</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => setSettings({
                  ...settings,
                  reducedMotion: e.target.checked
                })}
                className="w-4 h-4"
              />
              <span>Reduce Motion</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.audioDescription}
                onChange={(e) => setSettings({
                  ...settings,
                  audioDescription: e.target.checked
                })}
                className="w-4 h-4"
              />
              <span>Audio Descriptions</span>
            </label>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="mt-3 px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      )}
    </>
  )
}

// Screen reader announcements for audio changes
export function AudioAccessibility() {
  const { volume, fftData } = useAudioStore()
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    if (volume > 0.8) {
      setAnnouncement('High volume detected')
    } else if (volume < 0.1) {
      setAnnouncement('Volume very low')
    } else {
      setAnnouncement('')
    }
  }, [volume])

  useEffect(() => {
    if (fftData && fftData.some(val => val > 200)) {
      setAnnouncement('High audio activity')
    }
  }, [fftData])

  return (
    <div 
      aria-live="polite" 
      aria-atomic="true"
      className="screen-reader-only"
    >
      {announcement}
    </div>
  )
}