'use client'
import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Glitch, Vignette, BrightnessContrast, HueSaturation } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import * as THREE from 'three'
import { getAnalyserBands } from '../lib/analyser'
import { useMusicalPalette } from '../store/useMusicalPalette'

// Audio-reactive bloom effect
function AudioReactiveBloom() {
  const bloomRef = useRef<any>(null)
  const { key, scale, tempo } = useMusicalPalette()
  
  useFrame(() => {
    if (bloomRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        
        // Dynamic bloom intensity based on audio
        bloomRef.current.intensity = 0.5 + audioLevel * 2.0
        bloomRef.current.luminanceThreshold = 0.3 - audioLevel * 0.2
        bloomRef.current.radius = 0.8 + audioLevel * 0.4
        
        // Tempo-based bloom variations
        const tempoFactor = Math.sin(Date.now() * 0.001 * (tempo / 60)) * 0.1
        bloomRef.current.intensity += tempoFactor
        
      } catch (error) {
        // Fallback values
        bloomRef.current.intensity = 1.0
        bloomRef.current.luminanceThreshold = 0.4
        bloomRef.current.radius = 0.8
      }
    }
  })

  return (
    <Bloom
      ref={bloomRef}
      intensity={1.0}
      luminanceThreshold={0.4}
      radius={0.8}
      mipmapBlur
      levels={9}
    />
  )
}

// Audio-reactive glitch effect
function AudioReactiveGlitch() {
  const glitchRef = useRef<any>(null)
  
  useFrame(() => {
    if (glitchRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const bassLevel = bass / 255
        const midLevel = mid / 255
        
        // Glitch intensity based on bass and mid frequencies
        const glitchStrength = bassLevel * 0.3 + midLevel * 0.2
        
        // Only activate glitch on strong beats
        if (glitchStrength > 0.4) {
          glitchRef.current.perturbationMap = null
          glitchRef.current.dtSize = Math.min(glitchStrength * 128, 64)
        } else {
          glitchRef.current.dtSize = 0
        }
        
      } catch (error) {
        glitchRef.current.dtSize = 0
      }
    }
  })

  return (
    <Glitch
      ref={glitchRef}
      delay={[0.5, 1.0]}
      duration={[0.1, 0.3]}
      strength={[0.2, 0.4]}
      mode={GlitchMode.SPORADIC}
      active={true}
      ratio={0.15}
    />
  )
}

// Audio-reactive chromatic aberration
function AudioReactiveChromaticAberration() {
  const aberrationRef = useRef<any>(null)
  
  useFrame(() => {
    if (aberrationRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const trebleLevel = treble / 255
        const midLevel = mid / 255
        
        // Chromatic aberration based on treble frequencies
        const aberrationStrength = (trebleLevel * 0.4 + midLevel * 0.2) * 0.01
        aberrationRef.current.offset = new THREE.Vector2(aberrationStrength, aberrationStrength * 0.5)
        
      } catch (error) {
        aberrationRef.current.offset = new THREE.Vector2(0.001, 0.0005)
      }
    }
  })

  return (
    <ChromaticAberration
      ref={aberrationRef}
      offset={new THREE.Vector2(0.001, 0.0005)}
      radialModulation={true}
      modulationOffset={0.2}
    />
  )
}

// Audio-reactive color grading
function AudioReactiveColorGrading() {
  const hueRef = useRef<any>(null)
  const contrastRef = useRef<any>(null)
  const { key, scale } = useMusicalPalette()
  
  // Key-based color shifts
  const keyColorShifts = useMemo(() => {
    const keyMap: { [key: string]: number } = {
      'C': 0, 'C#': 0.1, 'D': 0.15, 'D#': 0.25, 'E': 0.3, 'F': 0.4,
      'F#': 0.5, 'G': 0.6, 'G#': 0.7, 'A': 0.8, 'A#': 0.9, 'B': 0.95
    }
    return keyMap[key] || 0
  }, [key])
  
  const scaleColorShifts = useMemo(() => {
    const scaleMap: { [scale: string]: number } = {
      'major': 0, 'minor': -0.1, 'dorian': 0.05, 'mixolydian': 0.1,
      'pentatonic': 0.15, 'blues': -0.15
    }
    return scaleMap[scale] || 0
  }, [scale])
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    if (hueRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioHueShift = ((bass + mid + treble) / (3 * 255)) * 0.2
        
        // Combine key, scale, and audio-based hue shifts
        const totalHueShift = keyColorShifts + scaleColorShifts + audioHueShift + 
                              Math.sin(time * 0.5) * 0.05
        
        hueRef.current.hue = totalHueShift
        hueRef.current.saturation = 0.1 + audioHueShift * 0.5
        
      } catch (error) {
        hueRef.current.hue = keyColorShifts + scaleColorShifts
        hueRef.current.saturation = 0.1
      }
    }
    
    if (contrastRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        
        // Dynamic contrast based on audio energy
        contrastRef.current.brightness = 0.05 + audioLevel * 0.1
        contrastRef.current.contrast = 0.1 + audioLevel * 0.2
        
      } catch (error) {
        contrastRef.current.brightness = 0.05
        contrastRef.current.contrast = 0.1
      }
    }
  })

  return (
    <>
      <HueSaturation
        ref={hueRef}
        hue={keyColorShifts + scaleColorShifts}
        saturation={0.1}
      />
      <BrightnessContrast
        ref={contrastRef}
        brightness={0.05}
        contrast={0.1}
      />
    </>
  )
}

// Artistic film grain effect
function FilmGrain() {
  const vignetteRef = useRef<any>(null)
  
  useFrame(() => {
    if (vignetteRef.current) {
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        
        // Subtle vignette that reacts to audio
        vignetteRef.current.darkness = 0.3 + audioLevel * 0.2
        
      } catch (error) {
        vignetteRef.current.darkness = 0.3
      }
    }
  })

  return (
    <Vignette
      ref={vignetteRef}
      offset={0.3}
      darkness={0.3}
      blendFunction={BlendFunction.MULTIPLY}
    />
  )
}

// Main artistic post-processing component
export default function ArtisticPostProcessing() {
  const { gl, scene, camera } = useThree()
  
  // Ensure renderer supports the effects we need
  useEffect(() => {
    if (gl) {
      gl.outputColorSpace = THREE.SRGBColorSpace
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.2
    }
  }, [gl])

  return (
    <EffectComposer multisampling={8}>
      {/* Core artistic effects */}
      <AudioReactiveBloom />
      <AudioReactiveChromaticAberration />
      <AudioReactiveColorGrading />
      
      {/* Subtle film effects */}
      <FilmGrain />
      
      {/* Occasional glitch effects for dramatic moments */}
      <AudioReactiveGlitch />
    </EffectComposer>
  )
}