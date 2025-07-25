'use client'
import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getAnalyserBands } from '../lib/analyser'
import { useMusicalPalette } from '../store/useMusicalPalette'

// Color palettes for different musical keys and scales
const colorPalettes = {
  major: {
    C: { primary: '#4ade80', secondary: '#3b82f6', accent: '#f59e0b' },
    'C#': { primary: '#06b6d4', secondary: '#8b5cf6', accent: '#ef4444' },
    D: { primary: '#f97316', secondary: '#10b981', accent: '#6366f1' },
    'D#': { primary: '#ec4899', secondary: '#14b8a6', accent: '#f59e0b' },
    E: { primary: '#8b5cf6', secondary: '#06d6a0', accent: '#f43f5e' },
    F: { primary: '#10b981', secondary: '#3b82f6', accent: '#f97316' },
    'F#': { primary: '#6366f1', secondary: '#ef4444', accent: '#06b6d4' },
    G: { primary: '#14b8a6', secondary: '#f59e0b', accent: '#8b5cf6' },
    'G#': { primary: '#f43f5e', secondary: '#4ade80', accent: '#6366f1' },
    A: { primary: '#06d6a0', secondary: '#ec4899', accent: '#14b8a6' },
    'A#': { primary: '#f59e0b', secondary: '#8b5cf6', accent: '#10b981' },
    B: { primary: '#ef4444', secondary: '#06b6d4', accent: '#ec4899' }
  },
  minor: {
    C: { primary: '#1e40af', secondary: '#7c2d12', accent: '#581c87' },
    'C#': { primary: '#166534', secondary: '#7c1d6f', accent: '#b91c1c' },
    D: { primary: '#7c2d12', secondary: '#166534', accent: '#4338ca' },
    'D#': { primary: '#7c1d6f', secondary: '#0f766e', accent: '#c2410c' },
    E: { primary: '#581c87', secondary: '#064e3b', accent: '#be123c' },
    F: { primary: '#166534', secondary: '#1e40af', accent: '#7c2d12' },
    'F#': { primary: '#4338ca', secondary: '#b91c1c', accent: '#0891b2' },
    G: { primary: '#0f766e', secondary: '#c2410c', accent: '#581c87' },
    'G#': { primary: '#be123c', secondary: '#15803d', accent: '#4338ca' },
    A: { primary: '#064e3b', secondary: '#7c1d6f', accent: '#0f766e' },
    'A#': { primary: '#c2410c', secondary: '#581c87', accent: '#166534' },
    B: { primary: '#b91c1c', secondary: '#0891b2', accent: '#7c1d6f' }
  }
}

// Volumetric fog geometry
class VolumetricFogGeometry extends THREE.PlaneGeometry {
  constructor() {
    super(50, 50, 32, 32)
    
    // Create layered planes for volumetric effect
    const positions = this.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
      const z = (Math.random() - 0.5) * 20
      positions.setZ(i, z)
    }
    positions.needsUpdate = true
  }
}

// Caustic water effect component
function CausticLighting() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const causticMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        causticStrength: { value: 1.0 },
        waveSpeed: { value: 1.0 },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },
        trebleLevel: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float causticStrength;
        uniform float waveSpeed;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Caustic pattern generation
        float causticPattern(vec2 uv, float time) {
          vec2 p = uv * 8.0;
          
          float wave1 = sin(p.x * 2.0 + time * waveSpeed) * cos(p.y * 1.5 + time * waveSpeed * 0.7);
          float wave2 = cos(p.x * 1.3 + time * waveSpeed * 1.2) * sin(p.y * 2.2 + time * waveSpeed * 0.9);
          
          float caustic = (wave1 + wave2) * 0.5;
          caustic = pow(abs(caustic), 2.0);
          
          return caustic;
        }
        
        void main() {
          float audioBoost = (bassLevel + midLevel + trebleLevel) * 0.5;
          float caustic = causticPattern(vUv, time) * causticStrength * (1.0 + audioBoost);
          
          // Color based on audio frequencies
          vec3 causticColor = vec3(
            0.2 + bassLevel * 0.6,
            0.6 + midLevel * 0.4,
            0.8 + trebleLevel * 0.2
          );
          
          gl_FragColor = vec4(causticColor * caustic, caustic * 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      
      try {
        const { bass, mid, treble } = getAnalyserBands()
        materialRef.current.uniforms.bassLevel.value = bass / 255
        materialRef.current.uniforms.midLevel.value = mid / 255
        materialRef.current.uniforms.trebleLevel.value = treble / 255
      } catch (error) {
        // Fallback values
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[30, 30]} />
      <primitive ref={materialRef} object={causticMaterial} attach="material" />
    </mesh>
  )
}

// God rays light beams
function GodRays({ position = [0, 10, 0] }: { position?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      groupRef.current.rotation.y = time * 0.1
      
      // Audio-reactive intensity
      try {
        const { bass, mid, treble } = getAnalyserBands()
        const audioLevel = (bass + mid + treble) / (3 * 255)
        groupRef.current.scale.setScalar(1 + audioLevel * 0.5)
      } catch (error) {
        // Fallback
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 12, 0]}>
          <coneGeometry args={[0.1, 20, 3]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Enhanced volumetric atmosphere
function VolumetricAtmosphere() {
  const fogRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const volumetricMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        density: { value: 0.3 },
        scattering: { value: 0.8 },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },
        trebleLevel: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        void main() {
          vPosition = position;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float density;
        uniform float scattering;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        
        // 3D noise function
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
        }
        
        void main() {
          vec3 pos = vWorldPosition * 0.1 + vec3(time * 0.1);
          
          float n1 = noise(pos) * 0.5;
          float n2 = noise(pos * 2.0) * 0.25;
          float n3 = noise(pos * 4.0) * 0.125;
          
          float combinedNoise = n1 + n2 + n3;
          
          // Audio-reactive density
          float audioFactor = (bassLevel + midLevel + trebleLevel) * 0.3;
          float finalDensity = (density + audioFactor) * combinedNoise;
          
          // Color based on frequencies
          vec3 fogColor = vec3(
            0.1 + bassLevel * 0.3,
            0.2 + midLevel * 0.4,
            0.4 + trebleLevel * 0.3
          );
          
          gl_FragColor = vec4(fogColor, finalDensity * scattering);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      
      try {
        const { bass, mid, treble } = getAnalyserBands()
        materialRef.current.uniforms.bassLevel.value = bass / 255
        materialRef.current.uniforms.midLevel.value = mid / 255
        materialRef.current.uniforms.trebleLevel.value = treble / 255
      } catch (error) {
        // Fallback values
      }
    }
  })

  return (
    <mesh ref={fogRef}>
      <sphereGeometry args={[25, 16, 16]} />
      <primitive ref={materialRef} object={volumetricMaterial} attach="material" />
    </mesh>
  )
}

// Main artistic lighting component
export default function ArtisticLighting() {
  const { key, scale } = useMusicalPalette()
  const lightRef1 = useRef<THREE.PointLight>(null)
  const lightRef2 = useRef<THREE.PointLight>(null)
  const lightRef3 = useRef<THREE.PointLight>(null)
  const directionalRef = useRef<THREE.DirectionalLight>(null)
  
  // Get current color palette
  const currentPalette = useMemo(() => {
    return colorPalettes[scale as keyof typeof colorPalettes]?.[key as keyof typeof colorPalettes.major] || 
           colorPalettes.major.C
  }, [key, scale])
  
  // Audio-reactive lighting updates
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    try {
      const { bass, mid, treble } = getAnalyserBands()
      const bassNorm = bass / 255
      const midNorm = mid / 255
      const trebleNorm = treble / 255
      
      // Dynamic light positions
      if (lightRef1.current) {
        lightRef1.current.position.x = Math.sin(time * 0.5 + bassNorm * Math.PI) * 8
        lightRef1.current.position.y = 5 + Math.cos(time * 0.3) * 3
        lightRef1.current.position.z = Math.cos(time * 0.7 + bassNorm * Math.PI) * 8
        lightRef1.current.intensity = 2 + bassNorm * 3
        lightRef1.current.color = new THREE.Color(currentPalette.primary)
      }
      
      if (lightRef2.current) {
        lightRef2.current.position.x = Math.cos(time * 0.6 + midNorm * Math.PI) * 6
        lightRef2.current.position.y = 6 + Math.sin(time * 0.4) * 2
        lightRef2.current.position.z = Math.sin(time * 0.8 + midNorm * Math.PI) * 6
        lightRef2.current.intensity = 1.5 + midNorm * 2.5
        lightRef2.current.color = new THREE.Color(currentPalette.secondary)
      }
      
      if (lightRef3.current) {
        lightRef3.current.position.x = Math.sin(time * 0.4 + trebleNorm * Math.PI) * 4
        lightRef3.current.position.y = 8 + Math.cos(time * 0.6) * 4
        lightRef3.current.position.z = Math.cos(time * 0.5 + trebleNorm * Math.PI) * 4
        lightRef3.current.intensity = 1 + trebleNorm * 2
        lightRef3.current.color = new THREE.Color(currentPalette.accent)
      }
      
      // Directional light audio reactivity
      if (directionalRef.current) {
        const audioAvg = (bassNorm + midNorm + trebleNorm) / 3
        directionalRef.current.intensity = 1.5 + audioAvg * 1.5
        directionalRef.current.color = new THREE.Color().lerpColors(
          new THREE.Color('#ffffff'),
          new THREE.Color(currentPalette.primary),
          audioAvg * 0.3
        )
      }
      
    } catch (error) {
      // Fallback to static lighting
      if (lightRef1.current) lightRef1.current.intensity = 2
      if (lightRef2.current) lightRef2.current.intensity = 1.5
      if (lightRef3.current) lightRef3.current.intensity = 1
      if (directionalRef.current) directionalRef.current.intensity = 1.5
    }
  })

  return (
    <>
      {/* Enhanced ambient lighting */}
      <ambientLight intensity={0.3} color={currentPalette.primary} />
      
      {/* Main directional light with shadows */}
      <directionalLight
        ref={directionalRef}
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        color={currentPalette.primary}
      />
      
      {/* Audio-reactive point lights */}
      <pointLight
        ref={lightRef1}
        position={[-8, 5, 8]}
        intensity={2}
        distance={25}
        decay={2}
        castShadow
        color={currentPalette.primary}
      />
      
      <pointLight
        ref={lightRef2}
        position={[8, 6, 8]}
        intensity={1.5}
        distance={20}
        decay={2}
        castShadow
        color={currentPalette.secondary}
      />
      
      <pointLight
        ref={lightRef3}
        position={[0, 8, -8]}
        intensity={1}
        distance={15}
        decay={2}
        color={currentPalette.accent}
      />
      
      {/* Hemisphere light for soft fill */}
      <hemisphereLight
        args={[currentPalette.secondary, currentPalette.primary, 0.4]}
      />
      
      {/* Artistic effects */}
      <CausticLighting />
      <GodRays position={[0, 12, -5]} />
      <VolumetricAtmosphere />
      
      {/* Rim lights for depth */}
      <pointLight position={[-12, 3, -8]} color={currentPalette.accent} intensity={0.8} distance={18} />
      <pointLight position={[12, 3, -8]} color={currentPalette.secondary} intensity={0.8} distance={18} />
      <pointLight position={[0, -2, 12]} color={currentPalette.primary} intensity={1.2} distance={22} />
    </>
  )
}