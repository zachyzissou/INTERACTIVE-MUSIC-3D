'use client'
// src/components/WebGPURenderer.tsx
// Modern GPU renderer with WebGL fallback
import React, { useRef, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { WebGLRenderer } from 'three'
import { usePerformanceSettings } from '../store/usePerformanceSettings'

interface WebGPURendererProps {
  children: React.ReactNode
  className?: string
}

interface RendererCapabilities {
  webgpu: boolean
  webgl2: boolean
  webgl: boolean
  preferredRenderer: 'webgpu' | 'webgl2' | 'webgl'
  features: string[]
}

// GPU capability detection (simplified)
async function detectGPUCapabilities(): Promise<RendererCapabilities> {
  const capabilities: RendererCapabilities = {
    webgpu: false,
    webgl2: false,
    webgl: false,
    preferredRenderer: 'webgl',
    features: []
  }

  // Check WebGPU support
  if (await checkWebGPUSupport()) {
    capabilities.webgpu = true
    capabilities.preferredRenderer = 'webgpu'
    capabilities.features.push('WebGPU')
  }

  // Check WebGL support
  checkWebGLSupport(capabilities)

  return capabilities
}

async function checkWebGPUSupport(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false
  
  try {
    const gpu = (navigator as any).gpu
    if (!gpu || typeof gpu.requestAdapter !== 'function') return false
    
    const adapter = await gpu.requestAdapter()
    return !!adapter
  } catch {
    return false
  }
}

function checkWebGLSupport(capabilities: RendererCapabilities) {
  if (typeof document === 'undefined') return

  const canvas = document.createElement('canvas')
  
  // Check WebGL2
  if (canvas.getContext('webgl2')) {
    capabilities.webgl2 = true
    if (!capabilities.webgpu) {
      capabilities.preferredRenderer = 'webgl2'
    }
    capabilities.features.push('WebGL2')
  }

  // Check WebGL
  if (canvas.getContext('webgl')) {
    capabilities.webgl = true
    if (!capabilities.webgpu && !capabilities.webgl2) {
      capabilities.preferredRenderer = 'webgl'
    }
    capabilities.features.push('WebGL')
  }
}

function RendererManager({ children }: Readonly<{ children: React.ReactNode }>) {
  const { gl, scene, camera } = useThree()
  const { level } = usePerformanceSettings()
  
  useEffect(() => {
    if (!gl) return

    // Configure renderer based on capabilities and performance level
    if (gl instanceof WebGLRenderer) {
      // High-performance settings
      if (level === 'high') {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = 2 // PCFSoftShadowMap
        gl.outputColorSpace = 'srgb'
        gl.toneMapping = 5 // ACESFilmicToneMapping
        gl.toneMappingExposure = 1.0
      }
      
      // Medium performance settings
      else if (level === 'medium') {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = 1 // PCFShadowMap
        gl.outputColorSpace = 'srgb'
        gl.toneMapping = 1 // LinearToneMapping
      }
      
      // Low performance settings
      else {
        gl.shadowMap.enabled = false
        gl.outputColorSpace = 'srgb'
        gl.toneMapping = 0 // NoToneMapping
      }

      // Enable performance optimizations
      gl.info.autoReset = false
      gl.setPixelRatio(Math.min(window.devicePixelRatio, level === 'high' ? 2 : 1))
    }
  }, [gl, level, scene, camera])

  return <>{children}</>
}

export default function WebGPURenderer({ children, className = '' }: Readonly<WebGPURendererProps>) {
  const [capabilities, setCapabilities] = useState<RendererCapabilities | null>(null)
  const [renderingMode, setRenderingMode] = useState<'detecting' | 'webgpu' | 'webgl2' | 'webgl'>('detecting')
  const { level } = usePerformanceSettings()

  useEffect(() => {
    detectGPUCapabilities().then((caps) => {
      setCapabilities(caps)
      setRenderingMode(caps.preferredRenderer)
      if (process.env.NODE_ENV === 'development') {
        console.log('🎮 GPU capabilities detected:', caps)
      }
    })
  }, [])

  const getCanvasProps = () => {
    const baseProps = {
      className: `w-full h-full ${className}`,
      shadows: level === 'high',
      camera: {
        position: [0, 2, 8] as [number, number, number],
        fov: 75,
        near: 0.1,
        far: 1000
      },
      gl: {
        antialias: level !== 'low',
        alpha: true,
        powerPreference: level === 'high' ? 'high-performance' as const : 'default' as const,
        preserveDrawingBuffer: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: level === 'high'
      },
      frameloop: 'always' as const,
      performance: {
        min: level === 'low' ? 0.2 : 0.5,
        max: 1,
        debounce: 200
      }
    }

    return baseProps
  }

  if (renderingMode === 'detecting') {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Detecting optimal renderer...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Renderer Info HUD */}
      {capabilities && (
        <div className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/60 rounded text-white text-xs">
          🎮 {capabilities.preferredRenderer.toUpperCase()} | 
          ⚡ {level.toUpperCase()} | 
          ✨ {capabilities.features.join(', ')}
        </div>
      )}

      <Canvas {...getCanvasProps()}>
        <RendererManager>
          {children}
        </RendererManager>
      </Canvas>
    </div>
  )
}
