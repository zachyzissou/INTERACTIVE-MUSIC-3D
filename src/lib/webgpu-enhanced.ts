// Enhanced WebGPU Renderer with Fallback
import * as THREE from 'three'
import { getGPUTier } from 'detect-gpu'

export interface WebGPUCapabilities {
  supported: boolean
  adapter: GPUAdapter | null
  device: GPUDevice | null
  preferredFormat: GPUTextureFormat
  limits: GPUSupportedLimits | null
  features: GPUSupportedFeatures | null
}

export class EnhancedWebGPURenderer {
  private renderer: THREE.WebGLRenderer | THREE.WebGPURenderer | null = null
  private capabilities: WebGPUCapabilities = {
    supported: false,
    adapter: null,
    device: null,
    preferredFormat: 'bgra8unorm',
    limits: null,
    features: null
  }

  async initialize(canvas: HTMLCanvasElement): Promise<THREE.WebGLRenderer | THREE.WebGPURenderer> {
    // Check WebGPU support
    if ('gpu' in navigator) {
      try {
        const adapter = await navigator.gpu.requestAdapter({
          powerPreference: 'high-performance',
          forceFallbackAdapter: false
        })
        
        if (adapter) {
          const device = await adapter.requestDevice({
            requiredFeatures: ['texture-compression-bc', 'depth-clip-control'],
            requiredLimits: {
              maxTextureDimension2D: 8192,
              maxBufferSize: 268435456, // 256MB
              maxStorageBufferBindingSize: 134217728 // 128MB
            }
          })

          // Get preferred canvas format
          const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
          
          this.capabilities = {
            supported: true,
            adapter,
            device,
            preferredFormat: presentationFormat,
            limits: device.limits,
            features: device.features
          }

          // Create WebGPU renderer
          const WebGPURenderer = (await import('three/webgpu')).WebGPURenderer
          this.renderer = new WebGPURenderer({
            canvas,
            antialias: true,
            alpha: true
          })
          
          await (this.renderer as any).init()
          
          console.log('✅ WebGPU renderer initialized successfully')
          return this.renderer
        }
      } catch (error) {
        console.warn('WebGPU initialization failed, falling back to WebGL:', error)
      }
    }

    // Fallback to WebGL
    return this.createWebGLRenderer(canvas)
  }

  private createWebGLRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
    const gpuTier = getGPUTier()
    const isHighEnd = gpuTier.tier >= 2
    
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: isHighEnd,
      alpha: true,
      powerPreference: isHighEnd ? 'high-performance' : 'default',
      preserveDrawingBuffer: false,
      stencil: false,
      depth: true,
      failIfMajorPerformanceCaveat: false
    })

    // Configure WebGL extensions
    const gl = this.renderer.getContext()
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      console.log(`WebGL Renderer: ${vendor} - ${renderer}`)
    }

    // Enable extensions for better performance
    gl.getExtension('EXT_texture_filter_anisotropic')
    gl.getExtension('OES_texture_float_linear')
    gl.getExtension('WEBGL_lose_context')
    
    // Configure renderer
    this.renderer.shadowMap.enabled = isHighEnd
    this.renderer.shadowMap.type = isHighEnd ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    console.log('✅ WebGL renderer initialized as fallback')
    return this.renderer
  }

  getCapabilities(): WebGPUCapabilities {
    return this.capabilities
  }

  isWebGPU(): boolean {
    return this.capabilities.supported && this.renderer?.constructor.name === 'WebGPURenderer'
  }

  getRenderer(): THREE.WebGLRenderer | THREE.WebGPURenderer | null {
    return this.renderer
  }

  dispose(): void {
    if (this.capabilities.device) {
      this.capabilities.device.destroy()
    }
    if (this.renderer) {
      this.renderer.dispose()
    }
  }
}

// Singleton instance
export const webGPURenderer = new EnhancedWebGPURenderer()

// Shader compatibility layer
export function createShaderMaterial(
  vertexShader: string,
  fragmentShader: string,
  uniforms?: { [key: string]: THREE.IUniform }
): THREE.ShaderMaterial | THREE.NodeMaterial {
  if (webGPURenderer.isWebGPU()) {
    // Convert GLSL to WGSL for WebGPU
    // This would use a proper transpiler in production
    const NodeMaterial = (THREE as any).NodeMaterial
    if (NodeMaterial) {
      return new NodeMaterial() // Simplified - would need proper node setup
    }
  }
  
  // WebGL fallback
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: uniforms || {}
  })
}