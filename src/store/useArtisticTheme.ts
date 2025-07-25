'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Artistic theme types
export type ArtisticTheme = 
  | 'aquatic-fluidity'
  | 'retro-chiptune'
  | 'cosmic-blobs'
  | 'organic-growth'
  | 'neural-network'
  | 'crystal-resonance'

// Theme configuration interface
export interface ThemeConfig {
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    particles: string
  }
  shaderParams: {
    viscosity: number
    wobbliness: number
    distortion: number
    glowIntensity: number
    particleDensity: number
    waveAmplitude: number
  }
  lightingConfig: {
    ambientIntensity: number
    directionalIntensity: number
    pointLightIntensity: number
    shadowOpacity: number
    fogDensity: number
  }
  effectsConfig: {
    bloom: boolean
    glitch: boolean
    chromatic: boolean
    caustics: boolean
    volumetric: boolean
    ripples: boolean
  }
  audioReactivity: {
    geometryResponse: number
    colorResponse: number
    lightingResponse: number
    particleResponse: number
  }
}

// Predefined artistic themes
export const artisticThemes: Record<ArtisticTheme, ThemeConfig> = {
  'aquatic-fluidity': {
    name: 'Aquatic Fluidity',
    description: 'Immersive underwater experience with flowing water simulations and caustic lighting',
    colors: {
      primary: '#06b6d4',
      secondary: '#0891b2', 
      accent: '#0e7490',
      background: '#064e3b',
      particles: '#67e8f9'
    },
    shaderParams: {
      viscosity: 2.5,
      wobbliness: 0.8,
      distortion: 1.2,
      glowIntensity: 1.8,
      particleDensity: 1.5,
      waveAmplitude: 2.0
    },
    lightingConfig: {
      ambientIntensity: 0.4,
      directionalIntensity: 1.2, 
      pointLightIntensity: 1.8,
      shadowOpacity: 0.6,
      fogDensity: 0.8
    },
    effectsConfig: {
      bloom: true,
      glitch: false,
      chromatic: true,
      caustics: true,
      volumetric: true,
      ripples: true
    },
    audioReactivity: {
      geometryResponse: 1.5,
      colorResponse: 1.2,
      lightingResponse: 1.8,
      particleResponse: 2.0
    }
  },
  
  'retro-chiptune': {
    name: 'Retro Chiptune',
    description: 'Nostalgic 8-bit aesthetics with pixelated visuals and glitch effects',
    colors: {
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#8b5cf6',
      background: '#1f2937',
      particles: '#fbbf24'
    },
    shaderParams: {
      viscosity: 0.5,
      wobbliness: 2.0,
      distortion: 2.5,
      glowIntensity: 2.5,
      particleDensity: 0.8,
      waveAmplitude: 1.5
    },
    lightingConfig: {
      ambientIntensity: 0.3,
      directionalIntensity: 2.0,
      pointLightIntensity: 2.5,
      shadowOpacity: 0.4,
      fogDensity: 0.3
    },
    effectsConfig: {
      bloom: true,
      glitch: true,
      chromatic: true,
      caustics: false,
      volumetric: false,
      ripples: false
    },
    audioReactivity: {
      geometryResponse: 2.5,
      colorResponse: 2.0,
      lightingResponse: 2.2,
      particleResponse: 1.8
    }
  },

  'cosmic-blobs': {
    name: 'Cosmic Blobs',
    description: 'Ethereal space environment with starry effects and nebula-like formations',
    colors: {
      primary: '#8b5cf6',
      secondary: '#3b82f6',
      accent: '#ec4899',
      background: '#0a0a1a',
      particles: '#c084fc'
    },
    shaderParams: {
      viscosity: 1.8,
      wobbliness: 1.5,
      distortion: 1.0,
      glowIntensity: 3.0,
      particleDensity: 2.0,
      waveAmplitude: 1.2
    },
    lightingConfig: {
      ambientIntensity: 0.2,
      directionalIntensity: 0.8,
      pointLightIntensity: 3.0,
      shadowOpacity: 0.8,
      fogDensity: 1.2
    },
    effectsConfig: {
      bloom: true,
      glitch: false,
      chromatic: true,
      caustics: false,
      volumetric: true, 
      ripples: true
    },
    audioReactivity: {
      geometryResponse: 1.8,
      colorResponse: 2.5,
      lightingResponse: 2.0,
      particleResponse: 2.5
    }
  },

  'organic-growth': {
    name: 'Organic Growth',
    description: 'Living, breathing ecosystem with natural growth patterns and earthy tones',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#84cc16',
      background: '#1f2937',
      particles: '#6ee7b7'
    },
    shaderParams: {
      viscosity: 1.2,
      wobbliness: 3.0,
      distortion: 0.8,
      glowIntensity: 1.5,
      particleDensity: 1.8,
      waveAmplitude: 2.5
    },
    lightingConfig: {
      ambientIntensity: 0.5,
      directionalIntensity: 1.5,
      pointLightIntensity: 1.2,
      shadowOpacity: 0.7,
      fogDensity: 0.6
    },
    effectsConfig: {
      bloom: true,
      glitch: false,
      chromatic: false,
      caustics: true,
      volumetric: true,
      ripples: true
    },
    audioReactivity: {
      geometryResponse: 2.0,
      colorResponse: 1.5,
      lightingResponse: 1.5,
      particleResponse: 2.2
    }
  },

  'neural-network': {
    name: 'Neural Network',
    description: 'Futuristic AI-inspired visuals with electric connections and data streams',
    colors: {
      primary: '#06d6a0',
      secondary: '#118ab2',
      accent: '#ffd166',
      background: '#073b4c', 
      particles: '#7209b7'
    },
    shaderParams: {
      viscosity: 0.8,
      wobbliness: 1.0,
      distortion: 3.0,
      glowIntensity: 2.2,
      particleDensity: 2.5,
      waveAmplitude: 0.8
    },
    lightingConfig: {
      ambientIntensity: 0.3,
      directionalIntensity: 1.8,
      pointLightIntensity: 2.0,
      shadowOpacity: 0.5,
      fogDensity: 0.4
    },
    effectsConfig: {
      bloom: true,
      glitch: true,
      chromatic: true,
      caustics: false,
      volumetric: false,
      ripples: false
    },
    audioReactivity: {
      geometryResponse: 1.5,
      colorResponse: 2.8,
      lightingResponse: 2.5,
      particleResponse: 3.0
    }
  },

  'crystal-resonance': {
    name: 'Crystal Resonance',
    description: 'Geometric crystalline structures with prismatic light refraction',
    colors: {
      primary: '#db2777',
      secondary: '#be185d',
      accent: '#fbbf24',
      background: '#111827',
      particles: '#f9a8d4'
    },
    shaderParams: {
      viscosity: 0.3,
      wobbliness: 0.5,
      distortion: 0.5,
      glowIntensity: 2.8,
      particleDensity: 1.0,
      waveAmplitude: 1.8
    },
    lightingConfig: {
      ambientIntensity: 0.4,
      directionalIntensity: 2.2,
      pointLightIntensity: 1.5,
      shadowOpacity: 0.9,
      fogDensity: 0.2
    },
    effectsConfig: {
      bloom: true,
      glitch: false,
      chromatic: true,
      caustics: true,
      volumetric: false,
      ripples: false
    },
    audioReactivity: {
      geometryResponse: 1.0,
      colorResponse: 1.8,
      lightingResponse: 3.0,
      particleResponse: 1.2
    }
  }
}

// Store interface
interface ArtisticThemeStore {
  currentTheme: ArtisticTheme
  customParams: Partial<ThemeConfig['shaderParams']>
  transitionProgress: number
  isTransitioning: boolean
  
  // Actions
  setTheme: (theme: ArtisticTheme) => void
  updateCustomParams: (params: Partial<ThemeConfig['shaderParams']>) => void
  resetCustomParams: () => void
  startTransition: () => void
  updateTransitionProgress: (progress: number) => void
  completeTransition: () => void
  
  // Getters
  getCurrentConfig: () => ThemeConfig
  getThemeConfig: (theme: ArtisticTheme) => ThemeConfig
}

// Zustand store with persistence
export const useArtisticTheme = create<ArtisticThemeStore>()(
  persist(
    (set, get) => ({
      currentTheme: 'cosmic-blobs',
      customParams: {},
      transitionProgress: 0,
      isTransitioning: false,

      setTheme: (theme: ArtisticTheme) => {
        const currentTheme = get().currentTheme
        if (currentTheme !== theme) {
          set({
            isTransitioning: true,
            transitionProgress: 0
          })
          
          // Animate transition
          const duration = 2000 // 2 seconds
          const startTime = Date.now()
          
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            set({ transitionProgress: progress })
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            } else {
              set({
                currentTheme: theme,
                isTransitioning: false,
                transitionProgress: 0,
                customParams: {} // Reset custom params on theme change
              })
            }
          }
          
          requestAnimationFrame(animate)
        }
      },

      updateCustomParams: (params: Partial<ThemeConfig['shaderParams']>) => {
        set(state => ({
          customParams: { ...state.customParams, ...params }
        }))
      },

      resetCustomParams: () => {
        set({ customParams: {} })
      },

      startTransition: () => {
        set({ isTransitioning: true, transitionProgress: 0 })
      },

      updateTransitionProgress: (progress: number) => {
        set({ transitionProgress: progress })
      },

      completeTransition: () => {
        set({ isTransitioning: false, transitionProgress: 0 })
      },

      getCurrentConfig: (): ThemeConfig => {
        const { currentTheme, customParams } = get()
        const baseConfig = artisticThemes[currentTheme]
        
        return {
          ...baseConfig,
          shaderParams: {
            ...baseConfig.shaderParams,
            ...customParams
          }
        }
      },

      getThemeConfig: (theme: ArtisticTheme): ThemeConfig => {
        return artisticThemes[theme]
      }
    }),
    {
      name: 'artistic-theme-storage',
      version: 1
    }
  )
)