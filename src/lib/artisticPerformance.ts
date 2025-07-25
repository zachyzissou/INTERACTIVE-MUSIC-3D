'use client'
import { create } from 'zustand'

// Performance metrics interface
export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  shaderPrograms: number
  gpuMemory: number
  timestamp: number
}

// Quality levels for adaptive scaling
export enum QualityLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  ULTRA = 3
}

// Quality settings for different levels
export const qualitySettings = {
  [QualityLevel.LOW]: {
    shaderComplexity: 0.3,
    particleDensity: 0.3,
    shadowMapSize: 512,
    bloomSamples: 4,
    maxLights: 3,
    geometryLOD: 2,
    postProcessing: false,
    volumetricEffects: false,
    causticEffects: false
  },
  [QualityLevel.MEDIUM]: {
    shaderComplexity: 0.6,
    particleDensity: 0.6,
    shadowMapSize: 1024,
    bloomSamples: 8,
    maxLights: 5,
    geometryLOD: 1,
    postProcessing: true,
    volumetricEffects: false,
    causticEffects: true
  },
  [QualityLevel.HIGH]: {
    shaderComplexity: 0.8,
    particleDensity: 0.8,
    shadowMapSize: 2048,
    bloomSamples: 12,
    maxLights: 8,
    geometryLOD: 0,
    postProcessing: true,
    volumetricEffects: true,
    causticEffects: true
  },
  [QualityLevel.ULTRA]: {
    shaderComplexity: 1.0,
    particleDensity: 1.0,
    shadowMapSize: 4096,
    bloomSamples: 16,
    maxLights: 12,
    geometryLOD: 0,
    postProcessing: true,
    volumetricEffects: true,
    causticEffects: true
  }
}

// Device capability detection
export class DeviceCapabilities {
  public static detect(): {
    isMobile: boolean
    hasWebGPU: boolean
    maxTextureSize: number
    supportedExtensions: string[]
    memoryInfo?: {
      totalJSHeapSize: number
      usedJSHeapSize: number
      jsHeapSizeLimit: number
    }
  } {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768
    
    const hasWebGPU = 'gpu' in navigator
    
    let maxTextureSize = 1024
    let supportedExtensions: string[] = []
    
    if (gl) {
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      supportedExtensions = gl.getSupportedExtensions() || []
    }
    
    const memoryInfo = (performance as any).memory
    
    return {
      isMobile,
      hasWebGPU,
      maxTextureSize,
      supportedExtensions,
      memoryInfo
    }
  }
  
  public static getRecommendedQuality(): QualityLevel {
    const caps = this.detect()
    
    if (caps.isMobile) {
      return QualityLevel.LOW
    }
    
    if (caps.hasWebGPU && caps.maxTextureSize >= 4096) {
      return QualityLevel.ULTRA
    }
    
    if (caps.maxTextureSize >= 2048) {
      return QualityLevel.HIGH
    }
    
    return QualityLevel.MEDIUM
  }
}

// Performance monitor class
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxSamples = 300 // 5 seconds at 60fps
  private lastTime = 0
  private frameCount = 0
  private startTime = performance.now()
  
  public update(renderer?: any): PerformanceMetrics {
    const now = performance.now()
    const deltaTime = now - this.lastTime
    this.lastTime = now
    this.frameCount++
    
    // Calculate FPS over the last second
    const timeWindow = 1000 // 1 second
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < timeWindow)
    const fps = recentMetrics.length > 0 ? recentMetrics.length : 60
    
    const metrics: PerformanceMetrics = {
      fps,
      frameTime: deltaTime,
      drawCalls: renderer?.info?.render?.calls || 0,
      triangles: renderer?.info?.render?.triangles || 0,
      geometries: renderer?.info?.memory?.geometries || 0,
      textures: renderer?.info?.memory?.textures || 0,
      shaderPrograms: renderer?.info?.programs?.length || 0,
      gpuMemory: this.estimateGPUMemory(renderer),
      timestamp: now
    }
    
    this.metrics.push(metrics)
    
    // Keep only recent samples
    if (this.metrics.length > this.maxSamples) {
      this.metrics = this.metrics.slice(-this.maxSamples)
    }
    
    return metrics
  }
  
  private estimateGPUMemory(renderer?: any): number {
    if (!renderer) return 0
    
    const info = renderer.info
    let memoryUsage = 0
    
    // Estimate texture memory (rough approximation)
    if (info.memory?.textures) {
      memoryUsage += info.memory.textures * 4 * 1024 * 1024 // Assume 4MB per texture
    }
    
    // Estimate geometry memory
    if (info.memory?.geometries) {
      memoryUsage += info.memory.geometries * 1024 * 1024 // Assume 1MB per geometry
    }
    
    return memoryUsage
  }
  
  public getAverageFPS(windowSize = 60): number {
    const recent = this.metrics.slice(-windowSize)
    if (recent.length === 0) return 60
    
    const totalFps = recent.reduce((sum, m) => sum + m.fps, 0)
    return totalFps / recent.length
  }
  
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }
  
  public isPerformanceGood(targetFps = 30): boolean {
    return this.getAverageFPS() >= targetFps
  }
}

// Adaptive quality manager
export class AdaptiveQualityManager {
  private monitor = new PerformanceMonitor()
  private currentQuality = QualityLevel.HIGH
  private targetFPS = 30
  private adjustmentCooldown = 5000 // 5 seconds between adjustments
  private lastAdjustment = 0
  
  constructor(targetFPS = 30) {
    this.targetFPS = targetFPS
    this.currentQuality = DeviceCapabilities.getRecommendedQuality()
  }
  
  public update(renderer?: any): {
    metrics: PerformanceMetrics
    qualityLevel: QualityLevel
    qualityChanged: boolean
  } {
    const metrics = this.monitor.update(renderer)
    const now = performance.now()
    
    let qualityChanged = false
    
    // Only adjust quality after cooldown period
    if (now - this.lastAdjustment > this.adjustmentCooldown) {
      const avgFps = this.monitor.getAverageFPS(30) // Last 30 frames
      
      if (avgFps < this.targetFPS && this.currentQuality > QualityLevel.LOW) {
        // Performance is poor, reduce quality
        this.currentQuality = Math.max(QualityLevel.LOW, this.currentQuality - 1)
        qualityChanged = true
        this.lastAdjustment = now
        console.log(`Reducing quality to ${QualityLevel[this.currentQuality]} (FPS: ${avgFps.toFixed(1)})`)
      } else if (avgFps > this.targetFPS * 1.5 && this.currentQuality < QualityLevel.ULTRA) {
        // Performance is good, try increasing quality
        this.currentQuality = Math.min(QualityLevel.ULTRA, this.currentQuality + 1)
        qualityChanged = true
        this.lastAdjustment = now
        console.log(`Increasing quality to ${QualityLevel[this.currentQuality]} (FPS: ${avgFps.toFixed(1)})`)
      }
    }
    
    return {
      metrics,
      qualityLevel: this.currentQuality,
      qualityChanged
    }
  }
  
  public getCurrentQuality(): QualityLevel {
    return this.currentQuality
  }
  
  public setTargetFPS(fps: number) {
    this.targetFPS = fps
  }
  
  public forceQuality(quality: QualityLevel) {
    this.currentQuality = quality
    this.lastAdjustment = performance.now()
  }
}

// Performance store
interface PerformanceStore {
  monitor: PerformanceMonitor
  adaptiveManager: AdaptiveQualityManager
  currentMetrics: PerformanceMetrics | null
  currentQuality: QualityLevel
  isMonitoring: boolean
  showDebugPanel: boolean
  allMetrics: PerformanceMetrics[]
  
  // Actions
  startMonitoring: () => void
  stopMonitoring: () => void
  updateMetrics: (renderer?: any) => void
  setTargetFPS: (fps: number) => void
  setQuality: (quality: QualityLevel) => void
  toggleDebugPanel: () => void
  resetMetrics: () => void
  setMetricsArray: (metrics: PerformanceMetrics[]) => void
}

export const useArtisticPerformance = create<PerformanceStore>((set, get) => ({
  monitor: new PerformanceMonitor(),
  adaptiveManager: new AdaptiveQualityManager(30),
  currentMetrics: null,
  currentQuality: DeviceCapabilities.getRecommendedQuality(),
  isMonitoring: false,
  showDebugPanel: false,
  allMetrics: [],
  
  startMonitoring: () => {
    set({ isMonitoring: true })
  },
  
  stopMonitoring: () => {
    set({ isMonitoring: false })
  },
  
  updateMetrics: (renderer?: any) => {
    const { adaptiveManager } = get()
    const { metrics, qualityLevel, qualityChanged } = adaptiveManager.update(renderer)
    
    set({
      currentMetrics: metrics,
      currentQuality: qualityLevel
    })
    
    return { metrics, qualityLevel, qualityChanged }
  },
  
  setTargetFPS: (fps: number) => {
    const { adaptiveManager } = get()
    adaptiveManager.setTargetFPS(fps)
  },
  
  setQuality: (quality: QualityLevel) => {
    const { adaptiveManager } = get()
    adaptiveManager.forceQuality(quality)
    set({ currentQuality: quality })
  },
  
  toggleDebugPanel: () => {
    set(state => ({ showDebugPanel: !state.showDebugPanel }))
  },
  
  resetMetrics: () => {
    set({
      monitor: new PerformanceMonitor(),
      adaptiveManager: new AdaptiveQualityManager(30),
      currentMetrics: null,
      allMetrics: []
    })
  },
  
  setMetricsArray: (metrics: PerformanceMetrics[]) => {
    set({ allMetrics: metrics })
  }
}))

// Performance debugging utilities
export const performanceUtils = {
  // Log detailed performance info
  logPerformanceInfo: (metrics: PerformanceMetrics) => {
    console.group('🎨 Artistic Performance Metrics')
    console.log(`FPS: ${metrics.fps.toFixed(1)}`)
    console.log(`Frame Time: ${metrics.frameTime.toFixed(2)}ms`)
    console.log(`Draw Calls: ${metrics.drawCalls}`)
    console.log(`Triangles: ${metrics.triangles.toLocaleString()}`)
    console.log(`Geometries: ${metrics.geometries}`)
    console.log(`Textures: ${metrics.textures}`)
    console.log(`GPU Memory: ${(metrics.gpuMemory / 1024 / 1024).toFixed(1)}MB`)
    console.groupEnd()
  },
  
  // Get performance bottleneck analysis
  analyzeBottlenecks: (metrics: PerformanceMetrics): string[] => {
    const bottlenecks: string[] = []
    
    if (metrics.fps < 30) {
      bottlenecks.push('Low FPS - Consider reducing quality')
    }
    
    if (metrics.frameTime > 33) {
      bottlenecks.push('High frame time - CPU/GPU bound')
    }
    
    if (metrics.drawCalls > 100) {
      bottlenecks.push('High draw calls - Consider batching')
    }
    
    if (metrics.triangles > 500000) {
      bottlenecks.push('High triangle count - Reduce geometry complexity')
    }
    
    if (metrics.gpuMemory > 100 * 1024 * 1024) {
      bottlenecks.push('High GPU memory usage - Optimize textures')
    }
    
    return bottlenecks
  },
  
  // Export performance report
  exportReport: (metrics: PerformanceMetrics[]): string => {
    const report = {
      timestamp: new Date().toISOString(),
      device: DeviceCapabilities.detect(),
      metrics: {
        averageFPS: metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length,
        averageFrameTime: metrics.reduce((sum, m) => sum + m.frameTime, 0) / metrics.length,
        maxDrawCalls: Math.max(...metrics.map(m => m.drawCalls)),
        maxTriangles: Math.max(...metrics.map(m => m.triangles)),
        maxGPUMemory: Math.max(...metrics.map(m => m.gpuMemory))
      },
      samples: metrics.length
    }
    
    return JSON.stringify(report, null, 2)
  }
}