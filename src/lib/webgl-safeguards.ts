// WebGL Initialization Safeguards
// Provides robust WebGL context creation with fallbacks and error recovery

interface WebGLContextEvent extends Event {
  statusMessage?: string
}

export interface WebGLCapabilities {
  webgl2: boolean
  webgl: boolean
  webgpu: boolean
  maxTextureSize: number
  maxVertexAttributes: number
  extensions: string[]
  version: string
  vendor: string
  renderer: string
}

export interface WebGLSafeGuardOptions {
  preferWebGL2?: boolean
  enableFallbacks?: boolean
  retryAttempts?: number
  retryDelay?: number
  requireWebGL?: boolean
}

class WebGLSafeguards {
  private static instance: WebGLSafeguards
  private capabilities: WebGLCapabilities | null = null
  private initPromise: Promise<WebGLCapabilities> | null = null

  static getInstance(): WebGLSafeguards {
    if (!WebGLSafeguards.instance) {
      WebGLSafeguards.instance = new WebGLSafeguards()
    }
    return WebGLSafeguards.instance
  }

  async detectCapabilities(): Promise<WebGLCapabilities> {
    if (this.capabilities) {
      return this.capabilities
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._detectCapabilities()
    this.capabilities = await this.initPromise
    return this.capabilities
  }

  private async _detectCapabilities(): Promise<WebGLCapabilities> {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    
    const capabilities: WebGLCapabilities = {
      webgl2: false,
      webgl: false,
      webgpu: false,
      maxTextureSize: 0,
      maxVertexAttributes: 0,
      extensions: [],
      version: '',
      vendor: '',
      renderer: ''
    }

    try {
      // Check WebGPU first (if available)
      if ('gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu?.requestAdapter()
          if (adapter) {
            capabilities.webgpu = true
            console.warn('WebGPU detected and available')
          }
        } catch (error) {
        }
      }

      // Check WebGL2
      let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
      try {
        gl = canvas.getContext('webgl2', {
          failIfMajorPerformanceCaveat: false,
          antialias: false
        }) as WebGL2RenderingContext
        
        if (gl) {
          capabilities.webgl2 = true
          capabilities.webgl = true
          console.warn('WebGL2 context created successfully')
        }
      } catch (error) {
        console.warn('WebGL2 context creation failed:', error)
      }

      // Fallback to WebGL1 if WebGL2 failed
      if (!gl) {
        try {
          gl = canvas.getContext('webgl', {
            failIfMajorPerformanceCaveat: false,
            antialias: false
          }) || canvas.getContext('experimental-webgl', {
            failIfMajorPerformanceCaveat: false,
            antialias: false
          }) as WebGLRenderingContext
          
          if (gl) {
            capabilities.webgl = true
            console.warn('WebGL1 context created successfully')
          }
        } catch (error) {
          console.warn('WebGL1 context creation failed:', error)
        }
      }

      if (gl) {
        // Get WebGL capabilities
        capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
        capabilities.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
        capabilities.version = gl.getParameter(gl.VERSION)
        capabilities.vendor = gl.getParameter(gl.VENDOR)
        capabilities.renderer = gl.getParameter(gl.RENDERER)

        // Get supported extensions
        const extensions = gl.getSupportedExtensions()
        if (extensions) {
          capabilities.extensions = extensions
        }

        // Clean up context
        const loseContextExt = gl.getExtension('WEBGL_lose_context')
        if (loseContextExt) {
          loseContextExt.loseContext()
        }
      }

    } catch (error) {
      console.error('WebGL capability detection failed:', error)
    } finally {
      // Clean up canvas
      canvas.remove()
    }

    return capabilities
  }

  async createSafeWebGLContext(
    canvas: HTMLCanvasElement,
    options: WebGLSafeGuardOptions = {}
  ): Promise<WebGLRenderingContext | WebGL2RenderingContext | null> {
    const {
      preferWebGL2 = true,
      enableFallbacks = true,
      retryAttempts = 3,
      retryDelay = 1000,
      requireWebGL = false
    } = options

    const capabilities = await this.detectCapabilities()

    if (!capabilities.webgl && !capabilities.webgpu) {
      if (requireWebGL) {
        throw new Error('WebGL is not supported on this device')
      }
      console.warn('No WebGL support detected')
      return null
    }

    const contextOptions: WebGLContextAttributes = {
      alpha: true,
      antialias: false, // Start conservative
      depth: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      stencil: false,
      desynchronized: false
    }

    // Safari-specific optimizations
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isSafari) {
      contextOptions.antialias = false
      contextOptions.powerPreference = 'default'
      contextOptions.preserveDrawingBuffer = true
    }

    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
    let lastError: Error | null = null

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        // Try WebGL2 first if preferred and available
        if (preferWebGL2 && capabilities.webgl2) {
          try {
            gl = canvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext
            if (gl) {
              console.warn(`WebGL2 context created (attempt ${attempt + 1})`)
              break
            }
          } catch (error) {
            console.warn(`WebGL2 attempt ${attempt + 1} failed:`, error)
            lastError = error as Error
          }
        }

        // Fallback to WebGL1 if WebGL2 failed or not preferred
        if (!gl && enableFallbacks && capabilities.webgl) {
          try {
            gl = canvas.getContext('webgl', contextOptions) as WebGLRenderingContext
            if (!gl) {
              gl = canvas.getContext('experimental-webgl', contextOptions) as WebGLRenderingContext
            }
            if (gl) {
              console.warn(`WebGL1 context created (attempt ${attempt + 1})`)
              break
            }
          } catch (error) {
            console.warn(`WebGL1 attempt ${attempt + 1} failed:`, error)
            lastError = error as Error
          }
        }

        // If we still don't have a context, wait before retrying
        if (!gl && attempt < retryAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }

      } catch (error) {
        lastError = error as Error
        console.error(`WebGL context creation attempt ${attempt + 1} failed:`, error)
      }
    }

    if (!gl) {
      const errorMsg = `Failed to create WebGL context after ${retryAttempts} attempts`
      console.error(errorMsg, lastError)
      
      if (requireWebGL) {
        throw new Error(`${errorMsg}: ${lastError?.message || 'Unknown error'}`)
      }
    }

    // Set up context loss/restore event handlers
    if (gl) {
      this.setupContextLossHandlers(canvas, gl)
    }

    return gl
  }

  private setupContextLossHandlers(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext | WebGL2RenderingContext
  ) {
    const handleContextLost = (event: WebGLContextEvent) => {
      event.preventDefault()
      console.warn('WebGL context lost, attempting recovery...')
      
      // Emit custom event for React components to handle
      canvas.dispatchEvent(new CustomEvent('webgl-context-lost', {
        detail: { gl, canvas }
      }))
    }

    const handleContextRestored = () => {
      console.warn('WebGL context restored')
      
      // Emit custom event for React components to handle
      canvas.dispatchEvent(new CustomEvent('webgl-context-restored', {
        detail: { gl, canvas }
      }))
    }

    canvas.addEventListener('webglcontextlost', handleContextLost as EventListener, false)
    canvas.addEventListener('webglcontextrestored', handleContextRestored as EventListener, false)
  }

  // Utility method to check if WebGL is likely to work
  static async isWebGLAvailable(): Promise<boolean> {
    const safeguards = WebGLSafeguards.getInstance()
    const capabilities = await safeguards.detectCapabilities()
    return capabilities.webgl || capabilities.webgpu
  }

  // Get performance tier based on capabilities
  static async getPerformanceTier(): Promise<'low' | 'medium' | 'high'> {
    const safeguards = WebGLSafeguards.getInstance()
    const capabilities = await safeguards.detectCapabilities()

    if (!capabilities.webgl) return 'low'

    if (capabilities.webgl2 && capabilities.maxTextureSize >= 4096) {
      return 'high'
    }

    if (capabilities.webgl && capabilities.maxTextureSize >= 2048) {
      return 'medium'
    }

    return 'low'
  }
}

export const webglSafeguards = WebGLSafeguards.getInstance()
export { WebGLSafeguards }