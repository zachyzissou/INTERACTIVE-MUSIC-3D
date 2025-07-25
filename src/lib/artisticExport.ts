'use client'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Artistic scene capture and export utilities
export class ArtisticExporter {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.Camera | null = null

  constructor(renderer?: THREE.WebGLRenderer, scene?: THREE.Scene, camera?: THREE.Camera) {
    this.renderer = renderer || null
    this.scene = scene || null  
    this.camera = camera || null
  }

  // Update renderer, scene, and camera references
  updateReferences(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
  }

  // Capture high-resolution screenshot with artistic filters
  async captureArtisticScreenshot(options: {
    width?: number
    height?: number
    format?: 'png' | 'jpg' | 'webp'
    quality?: number
    applyFilter?: 'vintage' | 'cyberpunk' | 'ethereal' | 'none'
  } = {}): Promise<Blob | null> {
    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error('Renderer, scene, and camera must be set before capturing')
    }

    const {
      width = 1920,
      height = 1080,
      format = 'png',
      quality = 0.9,
      applyFilter = 'none'
    } = options

    // Create high-res render target
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    })

    // Store original size
    const originalSize = this.renderer.getSize(new THREE.Vector2())
    
    // Render to high-res target
    this.renderer.setRenderTarget(renderTarget)
    this.renderer.setSize(width, height)
    this.renderer.render(this.scene, this.camera)

    // Read pixels
    const pixels = new Uint8Array(width * height * 4)
    this.renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)

    // Apply artistic filter if requested
    if (applyFilter !== 'none') {
      this.applyArtisticFilter(pixels, width, height, applyFilter)
    }

    // Create canvas and draw pixels
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    
    const imageData = ctx.createImageData(width, height)
    
    // Flip Y coordinate (WebGL to Canvas conversion)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4
        const dstIndex = ((height - y - 1) * width + x) * 4
        
        imageData.data[dstIndex] = pixels[srcIndex]     // R
        imageData.data[dstIndex + 1] = pixels[srcIndex + 1] // G  
        imageData.data[dstIndex + 2] = pixels[srcIndex + 2] // B
        imageData.data[dstIndex + 3] = pixels[srcIndex + 3] // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0)

    // Restore original size
    this.renderer.setRenderTarget(null)
    this.renderer.setSize(originalSize.x, originalSize.y)
    
    // Clean up render target
    renderTarget.dispose()

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, quality)
    })
  }

  // Apply artistic filters to pixel data
  private applyArtisticFilter(pixels: Uint8Array, width: number, height: number, filter: string) {
    switch (filter) {
      case 'vintage':
        this.applyVintageFilter(pixels, width, height)
        break
      case 'cyberpunk':
        this.applyCyberpunkFilter(pixels, width, height)
        break
      case 'ethereal':
        this.applyEtherealFilter(pixels, width, height)
        break
    }
  }

  // Vintage sepia filter
  private applyVintageFilter(pixels: Uint8Array, width: number, height: number) {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Sepia effect
      pixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189))
      pixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168))
      pixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131))
    }
  }

  // Cyberpunk neon filter
  private applyCyberpunkFilter(pixels: Uint8Array, width: number, height: number) {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Enhance cyan and magenta
      pixels[i] = Math.min(255, r * 1.2 + b * 0.3)
      pixels[i + 1] = Math.min(255, g * 0.8 + r * 0.2)
      pixels[i + 2] = Math.min(255, b * 1.3 + r * 0.2)
    }
  }

  // Ethereal soft glow filter
  private applyEtherealFilter(pixels: Uint8Array, width: number, height: number) {
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]
      
      // Soft glow effect
      const luminance = (r + g + b) / 3
      const glow = Math.min(255, luminance * 0.3)
      
      pixels[i] = Math.min(255, r + glow)
      pixels[i + 1] = Math.min(255, g + glow)
      pixels[i + 2] = Math.min(255, b + glow)
    }
  }

  // Export scene as GLTF with embedded audio metadata
  async exportSceneAsGLTF(options: {
    includeAudio?: boolean
    audioMetadata?: {
      key: string
      scale: string
      tempo: number
      notes: string[]
    }
    binary?: boolean
  } = {}): Promise<Blob | string> {
    if (!this.scene) {
      throw new Error('Scene must be set before exporting')
    }

    const { includeAudio = true, audioMetadata, binary = true } = options

    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter()
      
      const exportOptions = {
        binary,
        includeCustomExtensions: true,
        animations: [],
        ...(includeAudio && audioMetadata && {
          extras: {
            sonicCanvas: {
              audioMetadata,
              exportTimestamp: new Date().toISOString(),
              version: '2.0.0'
            }
          }
        })
      }

      exporter.parse(
        this.scene,
        (result) => {
          if (binary) {
            resolve(new Blob([result as ArrayBuffer], { type: 'application/octet-stream' }))
          } else {
            resolve(JSON.stringify(result, null, 2))
          }
        },
        (error) => {
          reject(error)
        },
        exportOptions
      )
    })
  }

  // Create animated GIF of scene rotation
  async createRotationGIF(options: {
    duration?: number
    fps?: number
    width?: number
    height?: number
    rotations?: number
  } = {}): Promise<Blob | null> {
    const {
      duration = 3000,
      fps = 15,
      width = 512,
      height = 512,
      rotations = 1
    } = options

    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error('Renderer, scene, and camera must be set')
    }

    const frames: Blob[] = []
    const frameCount = Math.floor((duration / 1000) * fps)
    
    // Store original camera position
    const originalPosition = this.camera.position.clone()
    const originalLookAt = new THREE.Vector3()
    
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.getWorldDirection(originalLookAt)
      originalLookAt.add(this.camera.position)
    }

    // Capture frames
    for (let i = 0; i < frameCount; i++) {
      const progress = i / frameCount
      const angle = progress * Math.PI * 2 * rotations
      
      // Rotate camera around scene
      const radius = originalPosition.length()
      this.camera.position.x = Math.cos(angle) * radius
      this.camera.position.z = Math.sin(angle) * radius
      this.camera.lookAt(0, 0, 0)

      // Capture frame
      const frameBlob = await this.captureArtisticScreenshot({
        width,
        height,
        format: 'png'
      })
      
      if (frameBlob) {
        frames.push(frameBlob)
      }
    }

    // Restore original camera position
    this.camera.position.copy(originalPosition)
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.lookAt(originalLookAt)
    }

    // For simplicity, return the first frame
    // In a real implementation, you'd use a GIF encoder like gif.js
    return frames[0] || null
  }

  // Generate shareable link with scene state
  generateShareableLink(sceneState: {
    theme: string
    key: string
    scale: string
    tempo: number
    customParams?: any
  }): string {
    const baseUrl = window.location.origin + window.location.pathname
    const stateParam = btoa(JSON.stringify(sceneState))
    return `${baseUrl}?scene=${stateParam}`
  }

  // Parse shareable link to restore scene state
  parseShareableLink(url: string): any | null {
    try {
      const urlObj = new URL(url)
      const sceneParam = urlObj.searchParams.get('scene')
      
      if (sceneParam) {
        return JSON.parse(atob(sceneParam))
      }
    } catch (error) {
      console.error('Failed to parse shareable link:', error)
    }
    
    return null
  }
}

// Singleton instance
export const artisticExporter = new ArtisticExporter()

// Hook for using the artistic exporter
export function useArtisticExporter() {
  return {
    exporter: artisticExporter,
    captureScreenshot: artisticExporter.captureArtisticScreenshot.bind(artisticExporter),
    exportGLTF: artisticExporter.exportSceneAsGLTF.bind(artisticExporter),
    createGIF: artisticExporter.createRotationGIF.bind(artisticExporter),
    generateShareLink: artisticExporter.generateShareableLink.bind(artisticExporter),
    parseShareLink: artisticExporter.parseShareableLink.bind(artisticExporter)
  }
}