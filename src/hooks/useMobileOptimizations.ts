// src/hooks/useMobileOptimizations.ts
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface MobileState {
  isMobile: boolean
  isTouch: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  orientationAngle: number
}

export function useMobileOptimizations() {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTouch: false,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    orientationAngle: 0
  })

  useEffect(() => {
    const updateMobileState = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      setMobileState({
        isMobile,
        isTouch,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        orientationAngle: screen.orientation?.angle ?? 0
      })
      
      logger.info(`Mobile state: ${isMobile ? 'mobile' : 'desktop'}, touch: ${isTouch}`)
    }

    updateMobileState()
    
    window.addEventListener('resize', updateMobileState)
    window.addEventListener('orientationchange', updateMobileState)
    
    return () => {
      window.removeEventListener('resize', updateMobileState)
      window.removeEventListener('orientationchange', updateMobileState)
    }
  }, [])

  // Optimize performance for mobile
  const getOptimalSettings = () => {
    if (mobileState.isMobile) {
      return {
        pixelRatio: Math.min(mobileState.pixelRatio, 2), // Limit pixel ratio
        shadowMapSize: 512, // Smaller shadow maps
        antialias: false, // Disable expensive antialiasing
        toneMapping: false, // Simplified tone mapping
        maxObjects: 20 // Limit concurrent objects
      }
    }
    
    return {
      pixelRatio: Math.min(mobileState.pixelRatio, 3),
      shadowMapSize: 1024,
      antialias: true,
      toneMapping: true,
      maxObjects: 100
    }
  }

  return {
    ...mobileState,
    optimalSettings: getOptimalSettings()
  }
}
