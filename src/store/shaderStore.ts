import { create } from 'zustand'

export interface ShaderUniforms {
  time: number
  audioData: Float32Array
  bassLevel: number
  midLevel: number
  highLevel: number
  noiseScale: number
  glitchIntensity: number
  rippleIntensity: number
  audioReactivity: number
  [key: string]: any
}

interface ShaderState {
  // Active shader
  activeShader: string
  
  // Shader parameters
  glitchIntensity: number
  noiseScale: number
  rippleIntensity: number
  audioReactivity: number
  
  // Shader uniforms
  shaderUniforms: ShaderUniforms
  
  // Available shaders
  availableShaders: string[]
  
  // Actions
  setActiveShader: (shader: string) => void
  setGlitchIntensity: (intensity: number) => void
  setNoiseScale: (scale: number) => void
  setRippleIntensity: (intensity: number) => void
  setAudioReactivity: (reactivity: number) => void
  updateUniforms: (updates: Partial<ShaderUniforms>) => void
  resetToDefaults: () => void
}

const defaultUniforms: ShaderUniforms = {
  time: 0,
  audioData: new Float32Array(32),
  bassLevel: 0,
  midLevel: 0,
  highLevel: 0,
  noiseScale: 5.0,
  glitchIntensity: 0.5,
  rippleIntensity: 1.0,
  audioReactivity: 1.0
}

export const useShaderStore = create<ShaderState>((set, get) => ({
  // Initial state
  activeShader: 'metaball',
  glitchIntensity: 0.5,
  noiseScale: 5.0,
  rippleIntensity: 1.0,
  audioReactivity: 1.0,
  shaderUniforms: { ...defaultUniforms },
  availableShaders: ['metaball', 'voronoi', 'ripple', 'neonNoise', 'glitch'],

  // Actions
  setActiveShader: (shader: string) => {
    set({ activeShader: shader })
  },

  setGlitchIntensity: (intensity: number) => {
    set((state) => ({
      glitchIntensity: intensity,
      shaderUniforms: {
        ...state.shaderUniforms,
        glitchIntensity: intensity
      }
    }))
  },

  setNoiseScale: (scale: number) => {
    set((state) => ({
      noiseScale: scale,
      shaderUniforms: {
        ...state.shaderUniforms,
        noiseScale: scale
      }
    }))
  },

  setRippleIntensity: (intensity: number) => {
    set((state) => ({
      rippleIntensity: intensity,
      shaderUniforms: {
        ...state.shaderUniforms,
        rippleIntensity: intensity
      }
    }))
  },

  setAudioReactivity: (reactivity: number) => {
    set((state) => ({
      audioReactivity: reactivity,
      shaderUniforms: {
        ...state.shaderUniforms,
        audioReactivity: reactivity
      }
    }))
  },

  updateUniforms: (updates: Partial<ShaderUniforms>) => {
    set((state) => ({
      shaderUniforms: {
        ...state.shaderUniforms,
        ...updates
      }
    }))
  },

  resetToDefaults: () => {
    set({
      activeShader: 'metaball',
      glitchIntensity: 0.5,
      noiseScale: 5.0,
      rippleIntensity: 1.0,
      audioReactivity: 1.0,
      shaderUniforms: { ...defaultUniforms }
    })
  }
}))