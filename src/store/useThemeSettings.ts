import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VisualTheme = 'cyberpunk' | 'organic' | 'crystal' | 'plasma' | 'ethereal'

export interface ThemeConfig {
  id: VisualTheme
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  effects: {
    bloomIntensity: number
    chromaticAberration: number
    particleIntensity: number
    glitchEnabled: boolean
  }
  materials: {
    default: string
    metalness: number
    roughness: number
    transmission: number
  }
}

const themeConfigs: Record<VisualTheme, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      background: '#0a0a0f'
    },
    effects: {
      bloomIntensity: 2.5,
      chromaticAberration: 0.003,
      particleIntensity: 2.0,
      glitchEnabled: true
    },
    materials: {
      default: 'holographic',
      metalness: 0.9,
      roughness: 0.1,
      transmission: 0.0
    }
  },
  organic: {
    id: 'organic',
    name: 'Organic',
    colors: {
      primary: '#00ff88',
      secondary: '#88ff00',
      accent: '#00ffaa',
      background: '#0f1a0f'
    },
    effects: {
      bloomIntensity: 1.8,
      chromaticAberration: 0.001,
      particleIntensity: 1.5,
      glitchEnabled: false
    },
    materials: {
      default: 'cymatic',
      metalness: 0.3,
      roughness: 0.7,
      transmission: 0.2
    }
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal',
    colors: {
      primary: '#ffffff',
      secondary: '#ccffff',
      accent: '#ffffcc',
      background: '#1a1a2e'
    },
    effects: {
      bloomIntensity: 3.0,
      chromaticAberration: 0.005,
      particleIntensity: 3.0,
      glitchEnabled: false
    },
    materials: {
      default: 'crystal',
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.95
    }
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma',
    colors: {
      primary: '#ff0066',
      secondary: '#6600ff',
      accent: '#ff6600',
      background: '#2e0a1a'
    },
    effects: {
      bloomIntensity: 2.8,
      chromaticAberration: 0.004,
      particleIntensity: 2.5,
      glitchEnabled: true
    },
    materials: {
      default: 'plasma',
      metalness: 0.8,
      roughness: 0.2,
      transmission: 0.1
    }
  },
  ethereal: {
    id: 'ethereal',
    name: 'Ethereal',
    colors: {
      primary: '#88aaff',
      secondary: '#aa88ff',
      accent: '#88ffaa',
      background: '#0f0f1a'
    },
    effects: {
      bloomIntensity: 2.2,
      chromaticAberration: 0.002,
      particleIntensity: 1.8,
      glitchEnabled: false
    },
    materials: {
      default: 'holographic',
      metalness: 0.5,
      roughness: 0.3,
      transmission: 0.3
    }
  }
}

interface ThemeState {
  currentTheme: VisualTheme
  customSettings: Partial<ThemeConfig>
  isCustomized: boolean
  
  // Actions
  setTheme: (theme: VisualTheme) => void
  updateCustomSettings: (settings: Partial<ThemeConfig>) => void
  resetToDefault: () => void
  
  // Getters
  getCurrentConfig: () => ThemeConfig
  getThemeList: () => ThemeConfig[]
}

export const useThemeSettings = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'ethereal',
      customSettings: {},
      isCustomized: false,

      setTheme: (theme) => {
        set({ 
          currentTheme: theme, 
          customSettings: {},
          isCustomized: false 
        })
      },

      updateCustomSettings: (settings) => {
        set(state => ({
          customSettings: { ...state.customSettings, ...settings },
          isCustomized: true
        }))
      },

      resetToDefault: () => {
        set({ customSettings: {}, isCustomized: false })
      },

      getCurrentConfig: () => {
        const state = get()
        const baseConfig = themeConfigs[state.currentTheme]
        
        if (!state.isCustomized) return baseConfig
        
        return {
          ...baseConfig,
          ...state.customSettings,
          colors: { ...baseConfig.colors, ...state.customSettings.colors },
          effects: { ...baseConfig.effects, ...state.customSettings.effects },
          materials: { ...baseConfig.materials, ...state.customSettings.materials }
        }
      },

      getThemeList: () => Object.values(themeConfigs)
    }),
    {
      name: 'theme-settings',
      version: 1
    }
  )
)