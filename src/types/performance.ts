// src/types/performance.ts
/**
 * Enhanced type definitions for performance monitoring
 */

export interface PerformanceMetrics {
  readonly fps: number
  readonly memoryUsage: number
  readonly cpuUsage: number
  readonly gpuUsage: number
  readonly audioLatency: number
  readonly renderTime: number
  readonly timestamp: number
}

export interface PerformanceThresholds {
  readonly fps: { good: number; warning: number; critical: number }
  readonly memory: { good: number; warning: number; critical: number }
  readonly latency: { good: number; warning: number; critical: number }
}

export type PerformanceGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'critical'

export interface OptimizationSuggestion {
  readonly type: 'quality' | 'effects' | 'renderScale' | 'audioBufferSize'
  readonly action: 'increase' | 'decrease' | 'disable' | 'enable'
  readonly value: number
  readonly reason: string
  readonly impact: 'low' | 'medium' | 'high'
}

export interface SystemCapabilities {
  readonly webgl: boolean
  readonly webgpu: boolean
  readonly webxr: boolean
  readonly audioWorklets: boolean
  readonly sharedArrayBuffer: boolean
  readonly webAssembly: boolean
}

export interface PerformanceProfile {
  readonly id: string
  readonly name: string
  readonly settings: {
    readonly renderScale: number
    readonly shadowQuality: 'off' | 'low' | 'medium' | 'high'
    readonly postProcessing: boolean
    readonly particleCount: number
    readonly audioBufferSize: number
  }
  readonly targetMetrics: PerformanceMetrics
}

// Type guards
export const isValidPerformanceMetrics = (obj: any): obj is PerformanceMetrics => {
  return (
    typeof obj === 'object' &&
    typeof obj.fps === 'number' &&
    typeof obj.memoryUsage === 'number' &&
    typeof obj.timestamp === 'number'
  )
}

export const getPerformanceGrade = (metrics: PerformanceMetrics): PerformanceGrade => {
  if (metrics.fps >= 55 && metrics.memoryUsage < 100) return 'excellent'
  if (metrics.fps >= 45 && metrics.memoryUsage < 200) return 'good'
  if (metrics.fps >= 30 && metrics.memoryUsage < 400) return 'fair'
  if (metrics.fps >= 20) return 'poor'
  return 'critical'
}
