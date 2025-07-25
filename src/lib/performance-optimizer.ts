import { PerfLevel } from '@/store/usePerformanceSettings'

export interface DeviceCapabilities {
  gpu: 'high' | 'medium' | 'low'
  memory: number // GB
  cores: number
  mobile: boolean
  webgl2: boolean
  maxTextureSize: number
  maxRenderBufferSize: number
  supportedExtensions: string[]
}

export interface OptimizationSettings {
  maxParticles: number
  shadowQuality: 'high' | 'medium' | 'low' | 'off'
  bloomQuality: 'high' | 'medium' | 'low'
  antialiasing: boolean
  pixelRatio: number
  maxDrawCalls: number
  lodEnabled: boolean
  frustumCulling: boolean
  occlusionCulling: boolean
}

export class PerformanceOptimizer {
  private capabilities: DeviceCapabilities | null = null
  private settings: OptimizationSettings | null = null
  private frameHistory: number[] = []
  private lastOptimization = 0

  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) return this.capabilities

    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    
    if (!gl) {
      throw new Error('WebGL not supported')
    }

    const capabilities: DeviceCapabilities = {
      gpu: await this.detectGPUTier(),
      memory: this.getMemoryInfo(),
      cores: navigator.hardwareConcurrency || 4,
      mobile: this.isMobile(),
      webgl2: gl instanceof WebGL2RenderingContext,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      supportedExtensions: gl.getSupportedExtensions() || []
    }

    this.capabilities = capabilities
    return capabilities
  }

  private async detectGPUTier(): Promise<'high' | 'medium' | 'low'> {
    try {
      const { getGPUTier } = await import('detect-gpu')
      const gpuTier = await getGPUTier()
      
      if (gpuTier.tier >= 3) return 'high'
      if (gpuTier.tier >= 2) return 'medium'
      return 'low'
    } catch {
      return 'medium' // Default fallback
    }
  }

  private getMemoryInfo(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.jsHeapSizeLimit / (1024 * 1024 * 1024))
    }
    return 4 // Default assumption
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }

  generateOptimizationSettings(
    capabilities: DeviceCapabilities,
    targetFPS = 60
  ): OptimizationSettings {
    const { gpu, mobile, memory, webgl2 } = capabilities

    // Base settings for different GPU tiers
    const baseSettings = {
      high: {
        maxParticles: 50000,
        shadowQuality: 'high' as const,
        bloomQuality: 'high' as const,
        antialiasing: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxDrawCalls: 1000,
        lodEnabled: false,
        frustumCulling: true,
        occlusionCulling: true
      },
      medium: {
        maxParticles: 25000,
        shadowQuality: 'medium' as const,
        bloomQuality: 'medium' as const,
        antialiasing: webgl2,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        maxDrawCalls: 500,
        lodEnabled: true,
        frustumCulling: true,
        occlusionCulling: false
      },
      low: {
        maxParticles: 10000,
        shadowQuality: 'low' as const,
        bloomQuality: 'low' as const,
        antialiasing: false,
        pixelRatio: 1,
        maxDrawCalls: 200,
        lodEnabled: true,
        frustumCulling: true,
        occlusionCulling: false
      }
    }

    const settings = { ...baseSettings[gpu] }

    // Mobile optimizations
    if (mobile) {
      settings.maxParticles = Math.floor(settings.maxParticles * 0.5)
      settings.shadowQuality = settings.shadowQuality === 'high' ? 'medium' : 'low'
      settings.antialiasing = false
      settings.pixelRatio = 1
      settings.maxDrawCalls = Math.floor(settings.maxDrawCalls * 0.7)
    }

    // Memory-based adjustments
    if (memory < 4) {
      settings.maxParticles = Math.floor(settings.maxParticles * 0.6)
      settings.bloomQuality = 'low'
    }

    this.settings = settings
    return settings
  }

  trackFrameRate(fps: number) {
    this.frameHistory.push(fps)
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift()
    }

    // Auto-optimize if performance drops
    const now = Date.now()
    if (now - this.lastOptimization > 5000) { // Every 5 seconds
      this.autoOptimize()
      this.lastOptimization = now
    }
  }

  private autoOptimize() {
    if (!this.settings || this.frameHistory.length < 30) return

    const avgFPS = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
    const targetFPS = 45 // Minimum acceptable FPS

    if (avgFPS < targetFPS) {
      console.log(`🔧 Auto-optimizing: FPS ${avgFPS.toFixed(1)} < ${targetFPS}`)
      
      // Reduce particle count
      if (this.settings.maxParticles > 5000) {
        this.settings.maxParticles = Math.floor(this.settings.maxParticles * 0.8)
      }

      // Lower shadow quality
      if (this.settings.shadowQuality === 'high') {
        this.settings.shadowQuality = 'medium'
      } else if (this.settings.shadowQuality === 'medium') {
        this.settings.shadowQuality = 'low'
      } else if (this.settings.shadowQuality === 'low') {
        this.settings.shadowQuality = 'off'
      }

      // Disable antialiasing
      if (this.settings.antialiasing) {
        this.settings.antialiasing = false
      }

      // Lower pixel ratio
      if (this.settings.pixelRatio > 1) {
        this.settings.pixelRatio = Math.max(1, this.settings.pixelRatio - 0.25)
      }

      // Enable LOD if not already
      this.settings.lodEnabled = true
    }
  }

  getRecommendedSettings(): OptimizationSettings | null {
    return this.settings
  }

  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities
  }

  // Get performance level recommendation
  getRecommendedPerformanceLevel(): PerfLevel {
    if (!this.capabilities) return 'medium'

    const { gpu, mobile, memory } = this.capabilities

    if (mobile || memory < 4 || gpu === 'low') return 'low'
    if (gpu === 'high' && memory >= 8 && !mobile) return 'high'
    return 'medium'
  }

  // Dynamic quality scaling based on current performance
  getDynamicQualityMultiplier(): number {
    if (this.frameHistory.length < 10) return 1.0

    const recentFPS = this.frameHistory.slice(-10)
    const avgFPS = recentFPS.reduce((a, b) => a + b, 0) / recentFPS.length

    if (avgFPS > 55) return 1.2 // Increase quality
    if (avgFPS > 45) return 1.0 // Maintain quality
    if (avgFPS > 30) return 0.8 // Reduce quality
    return 0.6 // Significant reduction
  }

  // Get memory usage recommendation
  getMemoryBudget(): {
    textures: number // MB
    geometries: number // MB
    particles: number // count
    audio: number // MB
  } {
    const memory = this.capabilities?.memory || 4
    const mobile = this.capabilities?.mobile || false

    const baseBudget = mobile ? 0.5 : 1.0

    return {
      textures: Math.floor(memory * baseBudget * 0.3),
      geometries: Math.floor(memory * baseBudget * 0.2),
      particles: Math.floor((memory * baseBudget * 0.3) * 1000),
      audio: Math.floor(memory * baseBudget * 0.2)
    }
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()