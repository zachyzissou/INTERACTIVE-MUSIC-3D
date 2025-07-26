'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { 
  EffectComposer, 
  Bloom, 
  ChromaticAberration,
  DepthOfField,
  Noise,
  Vignette,
  Glitch,
  ColorAverage,
  DotScreen,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
  SMAA,
  Scanline,
  Pixelation,
  ColorDepth,
  Sepia
} from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode, KernelSize } from 'postprocessing'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioStore'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'

interface CinematicPostProcessingProps {
  theme?: 'cyberpunk' | 'organic' | 'crystal' | 'plasma' | 'ethereal'
  intensity?: number
}

export default function CinematicPostProcessing({
  theme = 'ethereal',
  intensity = 1.0
}: CinematicPostProcessingProps) {
  const { analysisData } = useAudioStore()
  const fftData = analysisData.frequencyData
  const volume = analysisData.volume
  const { level: perfLevel } = usePerformanceSettings()
  const { size } = useThree()
  
  // Effect refs for dynamic control
  const bloomRef = useRef<any>(null)
  const chromaticRef = useRef<any>(null)
  const glitchRef = useRef<any>(null)
  const hueSatRef = useRef<any>(null)
  const brightnessRef = useRef<any>(null)
  const depthOfFieldRef = useRef<any>(null)
  const vignetteRef = useRef<any>(null)
  
  // Audio analysis
  const audioParams = useMemo(() => {
    if (!fftData || fftData.length === 0) {
      return { bass: 0, mid: 0, treble: 0, average: 0, peaks: [] }
    }

    const bassEnd = Math.floor(fftData.length * 0.1)
    const midEnd = Math.floor(fftData.length * 0.5)
    
    const bass = fftData.slice(0, bassEnd).reduce((a: number, b: number) => a + b, 0) / bassEnd / 255
    const mid = fftData.slice(bassEnd, midEnd).reduce((a: number, b: number) => a + b, 0) / (midEnd - bassEnd) / 255
    const treble = fftData.slice(midEnd).reduce((a: number, b: number) => a + b, 0) / (fftData.length - midEnd) / 255
    const average = (bass + mid + treble) / 3

    // Detect audio peaks for dynamic effects
    const peaks: { frequency: number; intensity: number }[] = []
    for (let i = 1; i < fftData.length - 1; i++) {
      if (fftData[i] > fftData[i - 1] && fftData[i] > fftData[i + 1] && fftData[i] > 200) {
        peaks.push({ frequency: i, intensity: fftData[i] / 255 })
      }
    }

    return { bass, mid, treble, average, peaks }
  }, [fftData])

  // Theme-based effect configurations
  const themeConfig = useMemo(() => {
    const configs = {
      cyberpunk: {
        bloomIntensity: 2.5,
        bloomThreshold: 0.3,
        chromaticStrength: 0.003,
        glitchActive: true,
        colorTint: new THREE.Color(0x00ffff),
        vignetteStrength: 0.8,
      },
      organic: {
        bloomIntensity: 1.8,
        bloomThreshold: 0.5,
        chromaticStrength: 0.001,
        glitchActive: false,
        colorTint: new THREE.Color(0x00ff88),
        vignetteStrength: 0.4,
      },
      crystal: {
        bloomIntensity: 3.0,
        bloomThreshold: 0.2,
        chromaticStrength: 0.005,
        glitchActive: false,
        colorTint: new THREE.Color(0xffffff),
        vignetteStrength: 0.2,
      },
      plasma: {
        bloomIntensity: 2.8,
        bloomThreshold: 0.1,
        chromaticStrength: 0.004,
        glitchActive: true,
        colorTint: new THREE.Color(0xff00ff),
        vignetteStrength: 0.6,
      },
      ethereal: {
        bloomIntensity: 2.2,
        bloomThreshold: 0.4,
        chromaticStrength: 0.002,
        glitchActive: false,
        colorTint: new THREE.Color(0x88aaff),
        vignetteStrength: 0.3,
      },
    }
    
    return configs[theme]
  }, [theme])

  // Dynamic effect updates
  useFrame((state, delta) => {
    const { bass, mid, treble, average, peaks } = audioParams
    const config = themeConfig
    
    // Enhanced bloom with audio reactivity
    if (bloomRef.current) {
      const bloomIntensity = config.bloomIntensity * intensity * (1.0 + bass * 2.0)
      const bloomThreshold = config.bloomThreshold - (average * 0.3)
      
      bloomRef.current.intensity = Math.min(bloomIntensity, 5.0)
      bloomRef.current.luminanceThreshold = Math.max(bloomThreshold, 0.1)
      bloomRef.current.radius = 0.8 + treble * 0.4
    }

    // Dynamic chromatic aberration
    if (chromaticRef.current) {
      const strength = config.chromaticStrength * intensity * (1.0 + treble * 3.0)
      chromaticRef.current.offset = new THREE.Vector2(strength, strength * 0.7)
    }

    // Beat-reactive glitch
    if (glitchRef.current && config.glitchActive) {
      const glitchTrigger = bass > 0.7 || peaks.length > 3
      if (glitchTrigger) {
        glitchRef.current.delay.x = Math.random() * 3
        glitchRef.current.delay.y = Math.random() * 2
        glitchRef.current.strength.x = 0.3 + bass * 0.5
        glitchRef.current.strength.y = 0.2 + treble * 0.3
      }
    }

    // Audio-reactive color grading
    if (hueSatRef.current) {
      hueSatRef.current.hue = Math.sin(state.clock.elapsedTime * 0.3) * 0.3 * mid
      hueSatRef.current.saturation = -0.1 + average * 0.4
    }

    // Dynamic brightness and contrast
    if (brightnessRef.current) {
      brightnessRef.current.brightness = average * 0.15 * intensity
      brightnessRef.current.contrast = bass * 0.25 * intensity
    }

    // Audio-reactive depth of field
    if (depthOfFieldRef.current && perfLevel === 'high') {
      depthOfFieldRef.current.focusDistance = 0.02 + treble * 0.03
      depthOfFieldRef.current.bokehScale = 2 + bass * 4
    }

    // Dynamic vignette
    if (vignetteRef.current) {
      vignetteRef.current.darkness = config.vignetteStrength * (1.0 - average * 0.3)
    }
  })

  // Performance-based effect selection
  const effects = useMemo(() => {
    const baseEffects = [
      // Anti-aliasing
      <SMAA key="smaa" />,
      
      // Enhanced bloom with audio reactivity
      <Bloom
        ref={bloomRef}
        key="bloom"
        intensity={themeConfig.bloomIntensity * intensity}
        luminanceThreshold={themeConfig.bloomThreshold}
        luminanceSmoothing={0.9}
        blendFunction={BlendFunction.ADD}
        radius={0.8}
        levels={8}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />,
      
      // Dynamic vignette
      <Vignette
        ref={vignetteRef}
        key="vignette"
        darkness={themeConfig.vignetteStrength}
        offset={0.5}
        blendFunction={BlendFunction.NORMAL}
      />,
      
      // Advanced tone mapping
      <ToneMapping
        key="toneMapping"
        mode={ToneMappingMode.ACES_FILMIC}
        resolution={512}
        whitePoint={4.0}
        middleGrey={0.6}
        minLuminance={0.01}
        averageLuminance={1.0}
        adaptationRate={2.0}
      />,
    ]

    // Medium quality effects
    if (perfLevel !== 'low') {
      baseEffects.push(
        <ChromaticAberration
          ref={chromaticRef}
          key="chromatic"
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(themeConfig.chromaticStrength, themeConfig.chromaticStrength * 0.7)}
        />,
        
        <HueSaturation
          ref={hueSatRef}
          key="hueSat"
          hue={0}
          saturation={0}
          blendFunction={BlendFunction.NORMAL}
        />,
        
        <BrightnessContrast
          ref={brightnessRef}
          key="brightness"
          brightness={0}
          contrast={0}
          blendFunction={BlendFunction.NORMAL}
        />
      )
    }

    // High quality effects
    if (perfLevel === 'high') {
      baseEffects.push(
        <DepthOfField
          ref={depthOfFieldRef}
          key="dof"
          focusDistance={0.02}
          focalLength={0.05}
          bokehScale={3}
          height={Math.min(size.height, 720)}
          blendFunction={BlendFunction.NORMAL}
        />
      )

      // Theme-specific high-end effects
      if (themeConfig.glitchActive) {
        baseEffects.push(
          <Glitch
            ref={glitchRef}
            key="glitch"
            delay={new THREE.Vector2(8, 12)}
            duration={new THREE.Vector2(0.1, 0.3)}
            strength={new THREE.Vector2(0.2, 0.4)}
            mode={GlitchMode.SPORADIC}
            active={true}
            ratio={0.05}
          />
        )
      }

      // Add subtle film grain
      <Noise
        key="noise"
        opacity={0.015}
        blendFunction={BlendFunction.OVERLAY}
      />

      // Theme-specific color effects
      if (theme === 'cyberpunk') {
        baseEffects.push(
          <DotScreen
            key="dotscreen"
            blendFunction={BlendFunction.OVERLAY}
            angle={Math.PI * 0.5}
            scale={0.5}
            opacity={0.1}
          />
        )
      }

      if (theme === 'organic') {
        baseEffects.push(
          <ColorDepth
            key="colorDepth"
            bits={6}
            blendFunction={BlendFunction.NORMAL}
            opacity={0.3}
          />
        )
      }
    }

    return baseEffects
  }, [perfLevel, theme, themeConfig, intensity, size])

  return (
    <EffectComposer 
      multisampling={perfLevel === 'high' ? 8 : perfLevel === 'medium' ? 4 : 0}
      stencilBuffer={false}
      depthBuffer={true}
    >
      {effects}
    </EffectComposer>
  )
}