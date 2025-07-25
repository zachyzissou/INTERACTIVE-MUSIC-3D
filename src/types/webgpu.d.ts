// WebGPU type definitions and extensions
/// <reference types="@webgpu/types" />

declare module 'three/addons/renderers/webgpu/WebGPURenderer.js'

declare global {
  interface Navigator {
    gpu?: GPU
  }

  interface HTMLCanvasElement {
    getContext(contextId: 'webgpu'): GPUCanvasContext | null
  }

  interface Window {
    AudioContext: typeof AudioContext
    webkitAudioContext: typeof AudioContext
  }
}

// Extended WebGPU types for our use case
export interface WebGPUCapabilities {
  supported: boolean
  adapter: GPUAdapter | null
  device: GPUDevice | null
  features: string[]
  limits: Record<string, number>
}

export interface WebGPUUniforms {
  time: number
  audioLevel: number
  bass: number
  mid: number
  treble: number
  beatIntensity: number
  colorHue: number
  materialMetalness: number
  materialRoughness: number
  emissionStrength: number
}

export interface ShaderProgram {
  vertex: string
  fragment: string
  compute?: string
}

export interface GPUBufferUsageFlags {
  VERTEX: number
  INDEX: number
  UNIFORM: number
  STORAGE: number
  INDIRECT: number
  QUERY_RESOLVE: number
  COPY_SRC: number
  COPY_DST: number
  MAP_READ: number
  MAP_WRITE: number
}

export interface WebGPUContext {
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
  capabilities: WebGPUCapabilities
}
