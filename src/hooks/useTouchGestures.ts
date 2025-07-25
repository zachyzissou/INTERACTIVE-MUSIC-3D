import { useEffect, useRef } from 'react'

interface TouchHandler {
  onTap?: (x: number, y: number) => void
  onDoubleTap?: (x: number, y: number) => void
  onLongPress?: (x: number, y: number) => void
  onPinch?: (scale: number) => void
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void
}

export function useTouchGestures(element: HTMLElement | null, handlers: TouchHandler) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTapRef = useRef<number>(0)
  const initialPinchDistanceRef = useRef<number>(0)

  useEffect(() => {
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      
      const touch = e.touches[0]
      const rect = element.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      touchStartRef.current = {
        x,
        y,
        time: Date.now()
      }

      // Handle pinch gesture start
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialPinchDistanceRef.current = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
      } else {
        // Start long press timer
        longPressTimeoutRef.current = setTimeout(() => {
          if (handlers.onLongPress && touchStartRef.current) {
            navigator.vibrate?.(50) // Haptic feedback
            handlers.onLongPress(touchStartRef.current.x, touchStartRef.current.y)
          }
        }, 500)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      
      // Handle pinch gesture
      if (e.touches.length === 2 && handlers.onPinch) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        )
        
        if (initialPinchDistanceRef.current > 0) {
          const scale = currentDistance / initialPinchDistanceRef.current
          handlers.onPinch(scale)
        }
      } else if (touchStartRef.current) {
        // Cancel long press if finger moves too much
        const touch = e.touches[0]
        const rect = element.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        
        const distance = Math.hypot(
          x - touchStartRef.current.x,
          y - touchStartRef.current.y
        )
        
        if (distance > 10 && longPressTimeoutRef.current) {
          clearTimeout(longPressTimeoutRef.current)
          longPressTimeoutRef.current = null
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      
      // Clear long press timer
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }

      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const rect = element.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      const deltaX = x - touchStartRef.current.x
      const deltaY = y - touchStartRef.current.y
      const distance = Math.hypot(deltaX, deltaY)
      const duration = Date.now() - touchStartRef.current.time

      // Handle swipe gestures
      if (distance > 50 && duration < 300 && handlers.onSwipe) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        let direction: 'up' | 'down' | 'left' | 'right'
        
        if (angle >= -45 && angle <= 45) direction = 'right'
        else if (angle >= 45 && angle <= 135) direction = 'down'
        else if (angle >= 135 || angle <= -135) direction = 'left'
        else direction = 'up'
        
        handlers.onSwipe(direction, distance)
      }
      // Handle tap gestures
      else if (distance < 10 && duration < 300) {
        const now = Date.now()
        const timeSinceLastTap = now - lastTapRef.current
        
        if (timeSinceLastTap < 300 && handlers.onDoubleTap) {
          // Double tap
          navigator.vibrate?.([30, 50, 30]) // Haptic feedback
          handlers.onDoubleTap(touchStartRef.current.x, touchStartRef.current.y)
          lastTapRef.current = 0 // Reset to prevent triple tap
        } else if (handlers.onTap) {
          // Single tap
          navigator.vibrate?.(20) // Light haptic feedback
          handlers.onTap(touchStartRef.current.x, touchStartRef.current.y)
          lastTapRef.current = now
        }
      }

      touchStartRef.current = null
      initialPinchDistanceRef.current = 0
    }

    const handleTouchCancel = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
        longPressTimeoutRef.current = null
      }
      touchStartRef.current = null
      initialPinchDistanceRef.current = 0
    }

    // Add passive: false to allow preventDefault
    const options = { passive: false }
    
    element.addEventListener('touchstart', handleTouchStart, options)
    element.addEventListener('touchmove', handleTouchMove, options)
    element.addEventListener('touchend', handleTouchEnd, options)
    element.addEventListener('touchcancel', handleTouchCancel, options)

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current)
      }
    }
  }, [element, handlers])
}