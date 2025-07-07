import { create } from 'zustand'

export type SystemHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

interface SystemPerformanceState {
  // Core metrics
  fps: number
  frameTime: number
  memoryUsage: number
  cpuUsage: number
  
  // Graphics metrics
  webglContexts: number
  textureMemory: number
  geometryCount: number
  
  // System health
  health: SystemHealth
  lastHealthCheck: number
  
  // Error tracking
  errorCount: number
  lastError: string | null
  
  // Performance adaptations
  adaptiveQuality: boolean
  currentQualityLevel: number
  
  // Actions
  updateMetrics: (metrics: Partial<SystemPerformanceState>) => void
  recordError: (error: string) => void
  calculateHealth: () => void
  adaptPerformance: () => void
  reset: () => void
}

const calculateSystemHealth = (state: SystemPerformanceState): SystemHealth => {
  let score = 100
  
  // FPS penalties
  if (state.fps < 30) score -= 40
  else if (state.fps < 45) score -= 20
  else if (state.fps < 55) score -= 10
  
  // Frame time penalties
  if (state.frameTime > 33) score -= 30
  else if (state.frameTime > 20) score -= 15
  
  // Memory penalties
  if (state.memoryUsage > 80) score -= 25
  else if (state.memoryUsage > 60) score -= 10
  
  // Error penalties
  if (state.errorCount > 5) score -= 30
  else if (state.errorCount > 2) score -= 15
  
  // WebGL context penalties
  if (state.webglContexts > 2) score -= 20
  
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  if (score >= 30) return 'poor'
  return 'critical'
}

export const useSystemPerformance = create<SystemPerformanceState>((set, get) => ({
  // Initial state
  fps: 60,
  frameTime: 16.67,
  memoryUsage: 0,
  cpuUsage: 0,
  webglContexts: 0,
  textureMemory: 0,
  geometryCount: 0,
  health: 'excellent',
  lastHealthCheck: Date.now(),
  errorCount: 0,
  lastError: null,
  adaptiveQuality: true,
  currentQualityLevel: 1.0,
  
  updateMetrics: (metrics) => {
    set(state => {
      const newState = { ...state, ...metrics, lastHealthCheck: Date.now() }
      return newState
    })
    get().calculateHealth()
  },
  
  recordError: (error) => {
    set(state => ({
      errorCount: state.errorCount + 1,
      lastError: error,
    }))
    get().calculateHealth()
  },
  
  calculateHealth: () => {
    const state = get()
    const health = calculateSystemHealth(state)
    set({ health })
    
    // Trigger adaptive performance if enabled
    if (state.adaptiveQuality) {
      get().adaptPerformance()
    }
  },
  
  adaptPerformance: () => {
    const state = get()
    let newQualityLevel = state.currentQualityLevel
    
    switch (state.health) {
      case 'critical':
        newQualityLevel = 0.3
        break
      case 'poor':
        newQualityLevel = 0.5
        break
      case 'fair':
        newQualityLevel = 0.7
        break
      case 'good':
        newQualityLevel = 0.85
        break
      case 'excellent':
        newQualityLevel = 1.0
        break
    }
    
    // Smooth transitions
    const targetLevel = Math.max(0.3, Math.min(1.0, newQualityLevel))
    const smoothedLevel = state.currentQualityLevel + (targetLevel - state.currentQualityLevel) * 0.1
    
    if (Math.abs(smoothedLevel - state.currentQualityLevel) > 0.05) {
      set({ currentQualityLevel: smoothedLevel })
      
      // Emit performance adaptation event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('performance-adapt', {
          detail: { 
            level: smoothedLevel, 
            health: state.health,
            reason: `System health: ${state.health}, FPS: ${state.fps}, Memory: ${state.memoryUsage}%`
          }
        }))
      }
    }
  },
  
  reset: () => {
    set({
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      cpuUsage: 0,
      webglContexts: 0,
      textureMemory: 0,
      geometryCount: 0,
      health: 'excellent',
      lastHealthCheck: Date.now(),
      errorCount: 0,
      lastError: null,
      currentQualityLevel: 1.0,
    })
  }
}))

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const store = useSystemPerformance()
  
  React.useEffect(() => {
    let animationFrame: number
    let lastTime = performance.now()
    let frameCount = 0
    
    const measurePerformance = () => {
      const now = performance.now()
      const frameTime = now - lastTime
      lastTime = now
      frameCount++
      
      // Update frame time immediately
      store.updateMetrics({ frameTime })
      
      animationFrame = requestAnimationFrame(measurePerformance)
    }
    
    // Calculate FPS every second
    const fpsCalcInterval = setInterval(() => {
      store.updateMetrics({ fps: frameCount })
      frameCount = 0
      
      // Measure memory if available
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        store.updateMetrics({ memoryUsage })
      }
    }, 1000)
    
    animationFrame = requestAnimationFrame(measurePerformance)
    
    return () => {
      cancelAnimationFrame(animationFrame)
      clearInterval(fpsCalcInterval)
    }
  }, [store])
  
  return store
}

import React from 'react'
