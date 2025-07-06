// src/lib/mobileOptimizations.ts
export class MobileOptimizer {
  private isMobile = false
  private isLowEnd = false

  constructor() {
    this.detectDevice()
  }

  private detectDevice() {
    if (typeof window === 'undefined') return

    // Check if mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    // Detect low-end devices
    this.isLowEnd = this.detectLowEndDevice()
  }

  private detectLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false

    // Check device memory (if available)
    const memory = (navigator as any).deviceMemory
    if (memory && memory <= 2) return true

    // Check hardware concurrency
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true

    // Check for older iOS devices
    const isOldIOS = /iPhone|iPad/.test(navigator.userAgent) && 
                     /OS [1-9]_/.test(navigator.userAgent)
    if (isOldIOS) return true

    return false
  }

  getOptimizedSettings() {
    const baseSettings = {
      shadows: true,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      maxParticles: 500,
      maxObjects: 100,
      enablePostProcessing: true,
      renderDistance: 100
    }

    if (this.isLowEnd) {
      return {
        ...baseSettings,
        shadows: false,
        antialias: false,
        pixelRatio: 1,
        maxParticles: 100,
        maxObjects: 50,
        enablePostProcessing: false,
        renderDistance: 50
      }
    }

    if (this.isMobile) {
      return {
        ...baseSettings,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        maxParticles: 300,
        maxObjects: 75,
        renderDistance: 75
      }
    }

    return baseSettings
  }

  // Touch gesture handlers
  setupTouchGestures(element: HTMLElement) {
    if (!this.isMobile) return () => {}

    let startTouch: Touch | null = null
    let startTime = 0

    const handleTouchStart = (e: TouchEvent) => {
      startTouch = e.touches[0]
      startTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouch) return

      const endTouch = e.changedTouches[0]
      const timeDiff = Date.now() - startTime
      const distX = endTouch.clientX - startTouch.clientX
      const distY = endTouch.clientY - startTouch.clientY
      const distance = Math.sqrt(distX * distX + distY * distY)

      // Tap gesture
      if (timeDiff < 300 && distance < 10) {
        element.dispatchEvent(new CustomEvent('mobile-tap', {
          detail: { x: endTouch.clientX, y: endTouch.clientY }
        }))
      }

      // Swipe gesture
      if (timeDiff < 500 && distance > 50) {
        const direction = Math.abs(distX) > Math.abs(distY) 
          ? (distX > 0 ? 'right' : 'left')
          : (distY > 0 ? 'down' : 'up')
        
        element.dispatchEvent(new CustomEvent('mobile-swipe', {
          detail: { direction, distance }
        }))
      }

      startTouch = null
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }

  // Adaptive quality based on performance
  adaptQualityBasedOnPerformance(currentFPS: number) {
    const settings = this.getOptimizedSettings()

    if (currentFPS < 30) {
      // Reduce quality significantly
      return {
        ...settings,
        shadows: false,
        antialias: false,
        pixelRatio: 1,
        maxParticles: Math.floor(settings.maxParticles * 0.5),
        maxObjects: Math.floor(settings.maxObjects * 0.5),
        enablePostProcessing: false
      }
    } else if (currentFPS < 45) {
      // Reduce quality moderately
      return {
        ...settings,
        shadows: this.isLowEnd ? false : settings.shadows,
        maxParticles: Math.floor(settings.maxParticles * 0.75),
        maxObjects: Math.floor(settings.maxObjects * 0.75)
      }
    }

    return settings
  }

  isMobileDevice() {
    return this.isMobile
  }

  isLowEndDevice() {
    return this.isLowEnd
  }

  // Battery status monitoring
  async monitorBattery() {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return null
    }

    try {
      const battery = await (navigator as any).getBattery()
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      }
    } catch {
      return null
    }
  }

  // Network connection monitoring
  getConnectionInfo() {
    if (typeof navigator === 'undefined') return null

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (!connection) return null

    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
}

export const mobileOptimizer = new MobileOptimizer()
