// src/lib/renderer.ts
import * as THREE from 'three'
import { logger } from './logger'

export class AdvancedRenderer {
  private renderer: THREE.WebGLRenderer | null = null
  private webgpuRenderer: any = null // Will be GPURenderer when available
  private isWebGPUSupported = false
  private capabilities: any = null

  async initialize() {
    await this.checkWebGPUSupport()
  }

  private async checkWebGPUSupport() {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as any).gpu
        const adapter = await gpu.requestAdapter()
        if (adapter) {
          this.isWebGPUSupported = true
          this.capabilities = {
            adapter,
            limits: adapter.limits,
            features: Array.from(adapter.features || [])
          }
          logger.info(`WebGPU support detected with ${this.capabilities.features.length} features`)
        }
      } catch (error) {
        logger.error('WebGPU not supported: ' + String(error))
        this.isWebGPUSupported = false
      }
    }
  }

  async initializeRenderer(canvas: HTMLCanvasElement) {
    // Try WebGPU first if supported
    if (this.isWebGPUSupported && this.capabilities) {
      try {
        // Note: This is future-proofing for when Three.js WebGPU is stable
        // For now, we use enhanced WebGL with WebGPU capability detection
        logger.info('WebGPU capable but using enhanced WebGL renderer')
      } catch (error) {
        logger.warn(`WebGPU renderer failed, falling back to WebGL: ${error}`)
      }
    }

    // Use optimized WebGL renderer with WebGPU-aware optimizations
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: this.isWebGPUSupported ? 'high-performance' : 'default',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: this.isWebGPUSupported // Enhanced precision for WebGPU-capable systems
    })

    // Enable optimizations based on capabilities
    const pixelRatio = this.isWebGPUSupported ? 
      Math.min(window.devicePixelRatio, 2) : 
      Math.min(window.devicePixelRatio, 1.5)
    
    this.renderer.setPixelRatio(pixelRatio)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = this.isWebGPUSupported ? 
      THREE.PCFSoftShadowMap : 
      THREE.PCFShadowMap

    logger.info(`Renderer initialized: ${this.isWebGPUSupported ? 'WebGPU-enhanced WebGL' : 'Standard WebGL'}`)
    return this.renderer
  }

  getRenderer() {
    return this.webgpuRenderer ?? this.renderer
  }

  isUsingWebGPU() {
    return !!this.webgpuRenderer && this.isWebGPUSupported
  }

  getCapabilities() {
    return {
      webgpu: this.isWebGPUSupported,
      webgl: !!this.renderer,
      capabilities: this.capabilities,
      renderer: this.isWebGPUSupported ? 'webgpu-enhanced' : 'webgl'
    }
  }

  dispose() {
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    if (this.webgpuRenderer) {
      this.webgpuRenderer.dispose?.()
      this.webgpuRenderer = null
    }
  }
}

export const advancedRenderer = new AdvancedRenderer()
