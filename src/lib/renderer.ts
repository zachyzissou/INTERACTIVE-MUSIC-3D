// src/lib/renderer.ts
import * as THREE from 'three'
import { logger } from './logger'

export class AdvancedRenderer {
  private renderer: THREE.WebGLRenderer | null = null
  private webgpuRenderer: any = null // Will be GPURenderer when available
  private isWebGPUSupported = false

  async initialize() {
    await this.checkWebGPUSupport()
  }

  private async checkWebGPUSupport() {
    if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
      try {
        const gpu = (navigator as any).gpu
        const adapter = await gpu.requestAdapter()
        this.isWebGPUSupported = !!adapter
      } catch (error) {
        logger.error('WebGPU not supported: ' + String(error))
        this.isWebGPUSupported = false
      }
    }
  }

  async initializeRenderer(canvas: HTMLCanvasElement) {
    // Use optimized WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    })

    // Enable optimizations
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    logger.info('WebGL renderer initialized with optimizations')
    return this.renderer
  }

  getRenderer() {
    return this.webgpuRenderer ?? this.renderer
  }

  isUsingWebGPU() {
    return !!this.webgpuRenderer && this.isWebGPUSupported
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
