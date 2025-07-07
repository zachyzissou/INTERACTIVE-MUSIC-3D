// src/components/AudioReactivePostProcess.tsx
'use client'
import React, { useRef, useMemo } from 'react'
import { useFrame, extend } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette, Glitch } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import * as THREE from 'three'
import { getAnalyserBands } from '../lib/analyser'

// Type augmentation for error tracking
declare global {
  interface Window {
    __postProcessErrorCount?: number
  }
}

// Custom audio-reactive effect
class AudioReactiveEffect extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uHigh: { value: 0 },
        uIntensity: { value: 0.5 },
        uColorShift: { value: 0.1 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uHigh;
        uniform float uIntensity;
        uniform float uColorShift;
        varying vec2 vUv;

        vec3 hsl2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
          return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
        }

        void main() {
          vec2 uv = vUv;
          
          // Audio-reactive distortion
          float bassWave = sin(uv.y * 20.0 + uTime * 2.0) * uBass * 0.02;
          float midWave = sin(uv.x * 15.0 + uTime * 3.0) * uMid * 0.015;
          uv += vec2(bassWave, midWave) * uIntensity;
          
          // Sample base color
          vec3 color = texture2D(tDiffuse, uv).rgb;
          
          // Audio-reactive color shifting
          float hueShift = (uBass * 0.1 + uMid * 0.05 + uHigh * 0.08) * uColorShift;
          color = hsl2rgb(vec3(hueShift, 1.0, 0.5)) * 0.1 + color * 0.9;
          
          // High-frequency sparkle effect
          float sparkle = sin(uv.x * 100.0 + uTime * 10.0) * sin(uv.y * 100.0 + uTime * 12.0);
          sparkle = smoothstep(0.8, 1.0, sparkle) * uHigh * 0.3;
          color += vec3(sparkle);
          
          // Bass-reactive vignette
          float vignette = 1.0 - length(uv - 0.5) * (1.0 + uBass * 0.5);
          color *= vignette;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
  }
}

extend({ AudioReactiveEffect })

interface AudioReactivePostProcessProps {
  intensity?: number
  enableGlitch?: boolean
  enableBloom?: boolean
  enableChromatic?: boolean
  performanceLevel?: 'low' | 'medium' | 'high'
}

export function AudioReactivePostProcess({
  intensity = 0.5,
  enableGlitch = true,
  enableBloom = true,
  enableChromatic = true,
  performanceLevel = 'medium'
}: Readonly<AudioReactivePostProcessProps>) {
  const audioEffectRef = useRef<any>(null)
  const bloomRef = useRef<any>(null)
  const glitchRef = useRef<any>(null)
  const chromaticRef = useRef<any>(null)
  
  // Performance-based settings
  const settings = useMemo(() => {
    switch (performanceLevel) {
      case 'low':
        return {
          bloomStrength: 0.3,
          bloomRadius: 0.2,
          bloomThreshold: 0.9,
          glitchStrength: 0.1,
          chromaticStrength: 0.001,
          noiseIntensity: 0.1
        }
      case 'high':
        return {
          bloomStrength: 1.0,
          bloomRadius: 0.8,
          bloomThreshold: 0.1,
          glitchStrength: 0.3,
          chromaticStrength: 0.003,
          noiseIntensity: 0.2
        }
      default: // medium
        return {
          bloomStrength: 0.6,
          bloomRadius: 0.4,
          bloomThreshold: 0.5,
          glitchStrength: 0.2,
          chromaticStrength: 0.002,
          noiseIntensity: 0.15
        }
    }
  }, [performanceLevel])

  // Separate functions to reduce complexity
  const updateAudioEffect = (time: number, bass: number, mid: number, high: number) => {
    if (audioEffectRef.current?.uniforms) {
      audioEffectRef.current.uniforms.uTime.value = time
      audioEffectRef.current.uniforms.uBass.value = bass / 255
      audioEffectRef.current.uniforms.uMid.value = mid / 255
      audioEffectRef.current.uniforms.uHigh.value = high / 255
      audioEffectRef.current.uniforms.uIntensity.value = intensity
    }
  }

  const updateBloomEffect = (bass: number, mid: number, high: number) => {
    if (bloomRef.current && enableBloom && typeof bloomRef.current.intensity !== 'undefined') {
      const audioLevel = (bass + mid + high) / (3 * 255)
      bloomRef.current.intensity = settings.bloomStrength * (0.5 + audioLevel * 1.5)
    }
  }

  const updateGlitchEffect = (bass: number) => {
    if (!glitchRef.current || !enableGlitch) return

    const beatIntensity = bass / 255
    const isStrongBeat = beatIntensity > 0.7
    
    // Update strength
    if (typeof glitchRef.current.strength !== 'undefined') {
      glitchRef.current.strength = isStrongBeat ? settings.glitchStrength * beatIntensity : 0
    }
    
    // Update active state
    if (typeof glitchRef.current.active !== 'undefined') {
      glitchRef.current.active = isStrongBeat || Math.random() < 0.05
    }
  }

  const updateChromaticEffect = (mid: number, time: number) => {
    if (chromaticRef.current && enableChromatic && chromaticRef.current.offset) {
      const midLevel = mid / 255
      chromaticRef.current.offset.x = settings.chromaticStrength * midLevel * Math.sin(time * 2)
      chromaticRef.current.offset.y = settings.chromaticStrength * midLevel * Math.cos(time * 1.5)
    }
  }

  useFrame(({ clock }) => {
    if (!enableBloom && !enableGlitch && !enableChromatic) return;
    
    try {
      const { bass, mid, treble: high } = getAnalyserBands()
      const time = clock.getElapsedTime()
      
      // Use safe updates with additional error handling
      if (audioEffectRef.current) {
        updateAudioEffect(time, bass, mid, high)
      }
      if (enableBloom && bloomRef.current) {
        updateBloomEffect(bass, mid, high)
      }
      if (enableGlitch && glitchRef.current) {
        updateGlitchEffect(bass)
      }
      if (enableChromatic && chromaticRef.current) {
        updateChromaticEffect(mid, time)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Reduce console noise, only warn on first few errors
      if (window.__postProcessErrorCount === undefined) {
        window.__postProcessErrorCount = 0
      }
      if (window.__postProcessErrorCount < 3) {
        console.warn('Post-processing frame error:', errorMessage);
        window.__postProcessErrorCount++
      }
    }
  })

  return (
    <EffectComposer multisampling={performanceLevel === 'high' ? 8 : 0}>
      {/* Bloom effect for bright highlights */}
      <Bloom
        ref={bloomRef}
        intensity={enableBloom ? settings.bloomStrength : 0}
        kernelSize={performanceLevel === 'high' ? 5 : 3}
        luminanceThreshold={settings.bloomThreshold}
        luminanceSmoothing={0.025}
        radius={settings.bloomRadius}
      />
      
      {/* Chromatic aberration for that analog feel */}
      <ChromaticAberration
        ref={chromaticRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(
          enableChromatic ? settings.chromaticStrength : 0, 
          enableChromatic ? settings.chromaticStrength : 0
        )}
      />
      
      {/* Film grain noise */}
      <Noise
        premultiply
        blendFunction={BlendFunction.SCREEN}
        opacity={settings.noiseIntensity}
      />
      
      {/* Glitch effect for beat drops */}
      <Glitch
        ref={glitchRef}
        delay={new THREE.Vector2(1.5, 3.5)}
        duration={new THREE.Vector2(0.6, 1.0)}
        strength={new THREE.Vector2(
          enableGlitch ? settings.glitchStrength : 0, 
          enableGlitch ? settings.glitchStrength : 0
        )}
        mode={GlitchMode.SPORADIC}
        active={false}
        ratio={0.85}
      />
      
      {/* Subtle vignette */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={0.3}
      />
    </EffectComposer>
  )
}

export default AudioReactivePostProcess
