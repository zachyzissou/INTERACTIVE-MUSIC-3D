'use client'
import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Plane } from '@react-three/drei'
import * as THREE from 'three'
import { useAudioStore } from '../store/useAudioStore'
import { usePerformanceSettings } from '../store/usePerformanceSettings'

// Shader sources - fallback to inline since imports are causing issues
const metaballFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uBassSensitivity;
uniform float uAudioData[32];
varying vec2 vUv;

float metaball(vec2 uv, vec2 center, float radius) {
    float dist = length(uv - center);
    return smoothstep(radius, radius - 0.02, dist);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Audio-reactive parameters
    float bassEnergy = uAudioData[4] * uBassSensitivity;
    float midEnergy = uAudioData[16];
    
    // Animated metaball centers
    vec2 center1 = vec2(sin(uTime * 0.5) * 0.3, cos(uTime * 0.7) * 0.2);
    vec2 center2 = vec2(cos(uTime * 0.3) * 0.4, sin(uTime * 0.6) * 0.3);
    vec2 center3 = vec2(sin(uTime * 0.8) * 0.2, cos(uTime * 0.4) * 0.35);
    
    // Audio-reactive sizes
    float radius1 = 0.15 + bassEnergy * 0.1;
    float radius2 = 0.12 + midEnergy * 0.08;
    float radius3 = 0.18 + bassEnergy * 0.05;
    
    // Calculate metaballs
    float m1 = metaball(uv, center1, radius1);
    float m2 = metaball(uv, center2, radius2);
    float m3 = metaball(uv, center3, radius3);
    
    // Smooth union for organic blending
    float combined = smin(smin(m1, m2, 0.1), m3, 0.1);
    
    // Color gradient based on audio
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
    
    vec3 finalColor = mix(color1, color2, sin(uTime + bassEnergy) * 0.5 + 0.5);
    finalColor = mix(finalColor, color3, midEnergy);
    
    // Add glow effect
    float glow = exp(-length(uv) * 2.0) * bassEnergy;
    finalColor += glow * vec3(1.0, 0.5, 1.0);
    
    gl_FragColor = vec4(finalColor * combined, combined * 0.8);
}
`

const voronoiFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioEnergy;
uniform float uBassEnergy;
varying vec2 vUv;

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float voronoi(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    
    float minDist = 1.0;
    
    for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash(i + neighbor);
            point = 0.5 + 0.5 * sin(uTime + 6.2831 * point);
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }
    
    return minDist;
}

void main() {
    vec2 uv = vUv * 8.0;
    
    float d = voronoi(uv);
    
    // Audio-reactive coloring
    vec3 color = vec3(0.0);
    color += vec3(1.0, 0.3, 0.8) * (1.0 - d) * uBassEnergy;
    color += vec3(0.3, 1.0, 0.8) * smoothstep(0.0, 0.2, d) * uAudioEnergy;
    color += vec3(0.8, 0.8, 1.0) * smoothstep(0.2, 0.4, d);
    
    gl_FragColor = vec4(color, 0.9);
}
`

const waterFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioEnergy;
uniform float uMidEnergy;
varying vec2 vUv;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for(int i = 0; i < 5; i++) {
        value += amplitude * smoothNoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    vec2 uv = vUv;
    
    // Create flowing water effect
    float time = uTime * 0.5;
    vec2 flowDir = vec2(cos(time), sin(time * 0.7));
    
    // Multiple octaves of noise for complex water movement
    float wave1 = fbm(uv * 4.0 + flowDir * time);
    float wave2 = fbm(uv * 8.0 - flowDir * time * 0.5);
    float wave3 = fbm(uv * 16.0 + flowDir * time * 0.3);
    
    // Audio-reactive intensity
    float audioWave = wave1 + wave2 * 0.5 + wave3 * 0.25;
    audioWave += uAudioEnergy * 0.3;
    audioWave += uMidEnergy * 0.2;
    
    // Water color
    vec3 waterColor = mix(
        vec3(0.0, 0.3, 0.8),
        vec3(0.0, 0.8, 1.0),
        audioWave
    );
    
    // Add sparkles based on audio
    float sparkle = smoothstep(0.8, 1.0, audioWave) * uAudioEnergy;
    waterColor += vec3(sparkle);
    
    gl_FragColor = vec4(waterColor, 0.85);
}
`

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

interface AudioReactiveShaderBackgroundProps {
  shaderType?: 'metaball' | 'voronoi' | 'water'
  position?: [number, number, number]
  scale?: [number, number, number]
}

export default function AudioReactiveShaderBackground({
  shaderType = 'metaball',
  position = [0, 0, -10],
  scale = [20, 20, 1]
}: AudioReactiveShaderBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const { analysisData } = useAudioStore()
  const perfLevel = usePerformanceSettings(s => s.level)
  
  // Choose fragment shader based on type
  const fragmentShader = useMemo(() => {
    switch (shaderType) {
      case 'voronoi': return voronoiFragmentShader
      case 'water': return waterFragmentShader
      default: return metaballFragmentShader
    }
  }, [shaderType])

  // Create shader material
  const shaderMaterial = useMemo(() => {
    const uniforms: Record<string, any> = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uAudioEnergy: { value: 0 },
      uBassEnergy: { value: 0 },
      uMidEnergy: { value: 0 },
    }

    // Add specific uniforms for metaball shader
    if (shaderType === 'metaball') {
      uniforms.uBassSensitivity = { value: 2.0 }
      uniforms.uAudioData = { value: new Array(32).fill(0) }
    }

    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  }, [shaderType, fragmentShader])

  // Update uniforms on each frame
  useFrame((state) => {
    if (!materialRef.current) return

    const material = materialRef.current
    const time = state.clock.getElapsedTime()

    // Update time
    material.uniforms.uTime.value = time

    // Update audio-reactive parameters
    material.uniforms.uAudioEnergy.value = analysisData.volume * 2.0
    material.uniforms.uBassEnergy.value = analysisData.bassEnergy * 2.0
    material.uniforms.uMidEnergy.value = analysisData.midEnergy * 2.0

    // Update resolution
    material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)

    // Update audio data array for metaball shader
    if (shaderType === 'metaball' && material.uniforms.uAudioData) {
      const audioArray = new Array(32).fill(0)
      
      // Map frequency data to audio array
      const freqData = analysisData.frequencyData
      if (freqData && freqData.length > 0) {
        for (let i = 0; i < Math.min(32, freqData.length); i++) {
          audioArray[i] = freqData[i] / 255.0
        }
      }
      
      material.uniforms.uAudioData.value = audioArray
    }
  })

  // Skip rendering on low performance
  if (perfLevel === 'low') {
    return null
  }

  return (
    <Plane
      ref={meshRef}
      args={[1, 1]}
      position={position}
      scale={scale}
      material={shaderMaterial}
    />
  )
}
