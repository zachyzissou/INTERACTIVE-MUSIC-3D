// src/hooks/usePerformanceProfiler.ts
/**
 * Performance profiling hook for detailed performance analysis
 */

import { useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { PerformanceMetrics, getPerformanceGrade } from '@/types/performance'

interface PerformanceProfile {
  component: string
  renderTime: number
  memoryDelta: number
  timestamp: number
}

interface ProfilerOptions {
  enabled?: boolean
  sampleRate?: number
  maxSamples?: number
  autoOptimize?: boolean
}

export const usePerformanceProfiler = (
  componentName: string,
  options: ProfilerOptions = {}
) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    sampleRate = 100, // Sample every 100ms
    maxSamples = 1000,
    autoOptimize = false
  } = options

  const profilesRef = useRef<PerformanceProfile[]>([])
  const lastSampleTime = useRef(0)
  const initialMemory = useRef(0)

  const startProfile = useCallback((label?: string) => {
    if (!enabled) return

    const now = performance.now()
    if (now - lastSampleTime.current < sampleRate) return

    performance.mark(`${componentName}-${label || 'render'}-start`)
    
    if ('memory' in performance) {
      initialMemory.current = (performance as any).memory.usedJSHeapSize
    }
  }, [componentName, enabled, sampleRate])

  const endProfile = useCallback((label?: string) => {
    if (!enabled) return

    const markName = `${componentName}-${label || 'render'}`
    performance.mark(`${markName}-end`)
    
    try {
      performance.measure(markName, `${markName}-start`, `${markName}-end`)
      
      const measures = performance.getEntriesByName(markName, 'measure')
      const lastMeasure = measures[measures.length - 1]
      
      if (lastMeasure) {
        const memoryDelta = 'memory' in performance 
          ? (performance as any).memory.usedJSHeapSize - initialMemory.current
          : 0

        const profile: PerformanceProfile = {
          component: componentName,
          renderTime: lastMeasure.duration,
          memoryDelta,
          timestamp: performance.now()
        }

        profilesRef.current.push(profile)
        
        // Keep only recent samples
        if (profilesRef.current.length > maxSamples) {
          profilesRef.current = profilesRef.current.slice(-maxSamples)
        }

        lastSampleTime.current = performance.now()

        // Log performance issues
        if (lastMeasure.duration > 16.67) { // > 60fps threshold
          logger.warn(`Performance: ${componentName} render took ${lastMeasure.duration.toFixed(2)}ms`)
        }
      }
    } catch (error) {
      logger.error(`Performance profiling error for ${componentName}: ${error}`)
    }

    // Cleanup
    performance.clearMarks(`${markName}-start`)
    performance.clearMarks(`${markName}-end`)
    performance.clearMeasures(markName)
  }, [componentName, enabled, maxSamples])

  const getMetrics = useCallback((): PerformanceMetrics | null => {
    if (profilesRef.current.length === 0) return null

    const recentProfiles = profilesRef.current.slice(-10)
    const avgRenderTime = recentProfiles.reduce((sum, p) => sum + p.renderTime, 0) / recentProfiles.length
    const avgMemoryDelta = recentProfiles.reduce((sum, p) => sum + p.memoryDelta, 0) / recentProfiles.length

    return {
      fps: Math.round(1000 / Math.max(avgRenderTime, 1)),
      memoryUsage: 'memory' in performance 
        ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        : 0,
      cpuUsage: Math.min(100, avgRenderTime * 6), // Rough CPU usage estimate
      gpuUsage: 0, // Would need WebGL context for real GPU metrics
      audioLatency: 0, // Would need audio context for real latency
      renderTime: avgRenderTime,
      timestamp: performance.now()
    }
  }, [])

  const getAnalysis = useCallback(() => {
    const metrics = getMetrics()
    if (!metrics) return null

    const grade = getPerformanceGrade(metrics)
    const profiles = profilesRef.current.slice(-100) // Last 100 samples

    return {
      metrics,
      grade,
      trends: {
        renderTime: profiles.map(p => p.renderTime),
        memoryDelta: profiles.map(p => p.memoryDelta),
        timestamps: profiles.map(p => p.timestamp)
      },
      recommendations: generateRecommendations(metrics, grade)
    }
  }, [getMetrics])

  // Auto-cleanup old performance entries
  useEffect(() => {
    if (!enabled) return

    const cleanup = setInterval(() => {
      try {
        // Clear old performance entries to prevent memory leaks
        const entries = performance.getEntriesByType('measure')
        if (entries.length > 1000) {
          performance.clearMeasures()
        }
      } catch (error) {
        logger.error(`Performance cleanup error: ${error}`)
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(cleanup)
  }, [enabled])

  return {
    startProfile,
    endProfile,
    getMetrics,
    getAnalysis,
    profiles: profilesRef.current,
    isEnabled: enabled
  }
}

function generateRecommendations(metrics: PerformanceMetrics, grade: string) {
  const recommendations = []

  if (metrics.fps < 30) {
    recommendations.push({
      type: 'critical',
      message: 'Frame rate is critically low. Consider reducing visual effects.',
      action: 'Reduce post-processing and particle count'
    })
  }

  if (metrics.memoryUsage > 500) {
    recommendations.push({
      type: 'warning',
      message: 'High memory usage detected. Check for memory leaks.',
      action: 'Review component cleanup and dispose Three.js objects'
    })
  }

  if (metrics.renderTime > 16.67) {
    recommendations.push({
      type: 'info',
      message: 'Render time exceeds 60fps target.',
      action: 'Optimize rendering pipeline or reduce scene complexity'
    })
  }

  return recommendations
}

export default usePerformanceProfiler
