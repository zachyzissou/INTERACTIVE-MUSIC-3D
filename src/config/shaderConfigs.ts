'use client'

import React from 'react'
import { 
  SparklesIcon, 
  BoltIcon, 
  FireIcon, 
  BeakerIcon,
  EyeDropperIcon,
  SwatchIcon,
  CubeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export interface ShaderConfig {
  id: string
  name: string
  icon: React.ReactNode
  params: {
    [key: string]: {
      value: number
      min: number
      max: number
      step: number
      label: string
    }
  }
}

export const shaderConfigurations: ShaderConfig[] = [
  {
    id: 'metaball',
    name: 'Metaballs',
    icon: <SparklesIcon className="w-5 h-5" />,
    params: {
      metaballCount: {
        value: 3,
        min: 1,
        max: 8,
        step: 1,
        label: 'Count'
      },
      glowIntensity: {
        value: 1.2,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Glow'
      },
      colorPrimaryR: {
        value: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color R'
      },
      colorPrimaryG: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color G'
      },
      colorPrimaryB: {
        value: 1.0,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B'
      },
      animationSpeed: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Speed'
      }
    }
  },
  {
    id: 'proceduralNoise',
    name: 'Noise',
    icon: <BeakerIcon className="w-5 h-5" />,
    params: {
      noiseScale: {
        value: 3.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Scale'
      },
      distortionAmount: {
        value: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Distortion'
      },
      colorAR: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-R'
      },
      colorAG: {
        value: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-G'
      },
      colorAB: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color A-B'
      },
      colorBR: {
        value: 0.8,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-R'
      },
      colorBG: {
        value: 0.3,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-G'
      },
      colorBB: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color B-B'
      }
    }
  },
  {
    id: 'waterRipple',
    name: 'Ripples',
    icon: <GlobeAltIcon className="w-5 h-5" />,
    params: {
      rippleSpeed: {
        value: 2.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        label: 'Speed'
      },
      rippleStrength: {
        value: 0.8,
        min: 0.1,
        max: 2.0,
        step: 0.05,
        label: 'Strength'
      },
      centerX: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Center X'
      },
      centerY: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Center Y'
      },
      colorIntensity: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Intensity'
      }
    }
  },
  {
    id: 'rgbGlitch',
    name: 'RGB Glitch',
    icon: <BoltIcon className="w-5 h-5" />,
    params: {
      glitchIntensity: {
        value: 0.5,
        min: 0.0,
        max: 2.0,
        step: 0.05,
        label: 'Intensity'
      },
      colorSeparation: {
        value: 0.02,
        min: 0.0,
        max: 0.1,
        step: 0.001,
        label: 'Separation'
      },
      scanlineFreq: {
        value: 100.0,
        min: 10.0,
        max: 500.0,
        step: 10.0,
        label: 'Scanlines'
      },
      noiseAmount: {
        value: 0.1,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Noise'
      },
      flickerSpeed: {
        value: 10.0,
        min: 1.0,
        max: 50.0,
        step: 1.0,
        label: 'Flicker'
      }
    }
  },
  {
    id: 'voronoi',
    name: 'Voronoi',
    icon: <CubeIcon className="w-5 h-5" />,
    params: {
      cellCount: {
        value: 8,
        min: 3,
        max: 20,
        step: 1,
        label: 'Cells'
      },
      animationSpeed: {
        value: 1.0,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Speed'
      },
      edgeWidth: {
        value: 0.05,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        label: 'Edge Width'
      },
      colorVariation: {
        value: 0.7,
        min: 0.0,
        max: 2.0,
        step: 0.1,
        label: 'Color Variation'
      },
      brightness: {
        value: 1.2,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Brightness'
      }
    }
  },
  {
    id: 'plasma',
    name: 'Plasma',
    icon: <FireIcon className="w-5 h-5" />,
    params: {
      frequency1: {
        value: 2.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Freq 1'
      },
      frequency2: {
        value: 3.0,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Freq 2'
      },
      phase1: {
        value: 0.0,
        min: 0.0,
        max: 6.28,
        step: 0.1,
        label: 'Phase 1'
      },
      phase2: {
        value: 1.57,
        min: 0.0,
        max: 6.28,
        step: 0.1,
        label: 'Phase 2'
      },
      colorShift: {
        value: 0.5,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        label: 'Color Shift'
      },
      intensity: {
        value: 1.5,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Intensity'
      }
    }
  }
]

export default shaderConfigurations
