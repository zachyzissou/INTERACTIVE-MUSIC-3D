// src/hooks/useAccessibility.ts
'use client'
import { useEffect, useState } from 'react'

interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

export function useAccessibility() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false
  })

  useEffect(() => {
    // Detect system preferences
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: Boolean(localStorage.getItem('largeText') === 'true')
    }

    // Check for screen reader
    const hasScreenReader = Boolean(
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      document.querySelector('[aria-hidden]')
    )

    const updatePreferences = () => {
      setPreferences({
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        largeText: mediaQueries.largeText.matches,
        screenReader: hasScreenReader,
        keyboardNavigation: false // Will be set on first tab key
      })
    }

    // Initial check
    updatePreferences()

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences)
    })

    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setPreferences(prev => ({ ...prev, keyboardNavigation: true }))
      }
    }

    const handleMouseDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: false }))
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences)
      })
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const updatePreference = (key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    
    // Apply CSS custom properties for styling
    document.documentElement.style.setProperty(
      `--a11y-${key}`,
      value ? '1' : '0'
    )
    
    // Store in localStorage
    localStorage.setItem(`a11y-${key}`, value.toString())
  }

  // Load stored preferences
  useEffect(() => {
    Object.keys(preferences).forEach(key => {
      const stored = localStorage.getItem(`a11y-${key}`)
      if (stored !== null) {
        updatePreference(key as keyof AccessibilityPreferences, stored === 'true')
      }
    })
  }, [])

  return {
    preferences,
    updatePreference,
    
    // Helper functions
    shouldReduceMotion: () => preferences.reduceMotion,
    shouldUseHighContrast: () => preferences.highContrast,
    shouldUseLargeText: () => preferences.largeText,
    isUsingScreenReader: () => preferences.screenReader,
    isUsingKeyboard: () => preferences.keyboardNavigation,
    
    // CSS class helpers
    getMotionClass: () => preferences.reduceMotion ? 'motion-reduce' : 'motion-normal',
    getContrastClass: () => preferences.highContrast ? 'contrast-high' : 'contrast-normal',
    getTextSizeClass: () => preferences.largeText ? 'text-large' : 'text-normal',
    getNavigationClass: () => preferences.keyboardNavigation ? 'keyboard-nav' : 'mouse-nav'
  }
}
