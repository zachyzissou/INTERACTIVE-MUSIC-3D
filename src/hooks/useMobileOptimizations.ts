// src/hooks/useMobileOptimizations.ts
import { useEffect, useState, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

interface MobileState {
  isMobile: boolean
  isTouch: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  orientationAngle: number
  isLandscape: boolean
  batteryLevel?: number
  connectionType?: string
}

interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'rotate'
  direction?: 'up' | 'down' | 'left' | 'right'
  velocity?: number
  scale?: number
  rotation?: number
  center?: { x: number; y: number }
}

export function useMobileOptimizations() {
  const [mobileState, setMobileState] = useState<MobileState>({
    isMobile: false,
    isTouch: false,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    orientationAngle: 0,
    isLandscape: false
  })

  const touchStartRef = useRef<TouchList | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const gestureCallbacksRef = useRef<((gesture: TouchGesture) => void)[]>([])

  useEffect(() => {
    const updateMobileState = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      setMobileState(prevState => ({
        ...prevState,
        isMobile,
        isTouch,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        orientationAngle: screen.orientation?.angle ?? 0,
        isLandscape: window.innerWidth > window.innerHeight
      }))
      
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

  // Touch gesture handling
  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartRef.current = event.touches
  }, [])

  // Enhanced touch gesture handling with pinch and rotate
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current) return

    // Multi-touch gestures (pinch, rotate)
    if (event.touches.length === 2 && touchStartRef.current.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const startTouch1 = touchStartRef.current[0]
      const startTouch2 = touchStartRef.current[1]

      // Calculate pinch scale
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      const startDistance = Math.sqrt(
        Math.pow(startTouch2.clientX - startTouch1.clientX, 2) + 
        Math.pow(startTouch2.clientY - startTouch1.clientY, 2)
      )
      const scale = currentDistance / startDistance

      // Calculate rotation
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      )
      const startAngle = Math.atan2(
        startTouch2.clientY - startTouch1.clientY,
        startTouch2.clientX - startTouch1.clientX
      )
      const rotation = (currentAngle - startAngle) * (180 / Math.PI)

      // Dispatch pinch gesture
      if (Math.abs(scale - 1) > 0.1) {
        const gesture: TouchGesture = {
          type: 'pinch',
          scale,
          center: {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
          }
        }
        
        // Notify gesture callbacks
        gestureCallbacksRef.current.forEach(callback => callback(gesture))
        logger.info(`Pinch gesture: scale=${scale.toFixed(2)}`)
      }

      // Dispatch rotate gesture
      if (Math.abs(rotation) > 5) {
        const gesture: TouchGesture = {
          type: 'rotate',
          rotation,
          center: {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
          }
        }
        
        gestureCallbacksRef.current.forEach(callback => callback(gesture))
        logger.info(`Rotate gesture: rotation=${rotation.toFixed(2)}°`)
      }
      
      return
    }

    // Single touch swipe
    const touchMove = event.touches[0]
    const touchStart = touchStartRef.current[0]

    const dx = touchMove.clientX - touchStart.clientX
    const dy = touchMove.clientY - touchStart.clientY

    // Determine swipe direction
    let direction: 'up' | 'down' | 'left' | 'right'
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left'
    } else {
      direction = dy > 0 ? 'down' : 'up'
    }

    const gesture: TouchGesture = {
      type: 'swipe',
      direction,
      velocity: Math.sqrt(dx * dx + dy * dy) / (event.timeStamp - (lastTouchRef.current?.time ?? event.timeStamp)),
      center: { x: touchMove.clientX, y: touchMove.clientY }
    }

    gestureCallbacksRef.current.forEach(callback => callback(gesture))
    logger.debug(`Swipe gesture: ${gesture.direction}, velocity: ${gesture.velocity?.toFixed(2)}`)

    lastTouchRef.current = { x: touchMove.clientX, y: touchMove.clientY, time: event.timeStamp }
  }, [])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    touchStartRef.current = null
  }, [])

  useEffect(() => {
    const element = window.document

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Register gesture callbacks
  const registerGestureCallback = useCallback((callback: (gesture: TouchGesture) => void) => {
    gestureCallbacksRef.current.push(callback)
    return () => {
      const index = gestureCallbacksRef.current.indexOf(callback)
      if (index > -1) {
        gestureCallbacksRef.current.splice(index, 1)
      }
    }
  }, [])

  return {
    ...mobileState,
    optimalSettings: getOptimalSettings(),
    registerGestureCallback
  }
}
