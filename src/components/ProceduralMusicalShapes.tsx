'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'
import { MeshTransmissionMaterial } from '@react-three/drei'

// Shape types with enhanced geometries
export type ShapeType = 'sphere' | 'torus' | 'icosahedron' | 'octahedron' | 'tetrahedron' | 'dodecahedron' | 'cylinder' | 'cone'

interface ProceduralShapeProps {
  type: ShapeType
  position: [number, number, number]
  soundType: 'note' | 'chord' | 'beat' | 'loop'
  noteValue?: string
  id: string
  onClick?: () => void
}

export function ProceduralShape({ type, position, soundType, noteValue = 'C4', id, onClick }: ProceduralShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<any>(null)
  const { fftData, waveformData, volume } = useAudioStore()
  
  // Audio-reactive uniforms
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    audioLevel: { value: 0 },
    bassLevel: { value: 0 },
    midLevel: { value: 0 },
    trebleLevel: { value: 0 },
    colorShift: { value: 0 },
    distortion: { value: 0 },
  }), [])

  // Create geometry based on type
  const geometry = useMemo(() => {
    switch (type) {
      case 'sphere':
        return new THREE.SphereGeometry(1, 64, 64)
      case 'torus':
        return new THREE.TorusGeometry(0.8, 0.3, 32, 64)
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(1, 2)
      case 'octahedron':
        return new THREE.OctahedronGeometry(1, 2)
      case 'tetrahedron':
        return new THREE.TetrahedronGeometry(1, 2)
      case 'dodecahedron':
        return new THREE.DodecahedronGeometry(1, 1)
      case 'cylinder':
        return new THREE.CylinderGeometry(0.5, 0.8, 2, 32)
      case 'cone':
        return new THREE.ConeGeometry(1, 2, 32)
      default:
        return new THREE.BoxGeometry(1, 1, 1)
    }
  }, [type])

  // Material based on sound type
  const material = useMemo(() => {
    const baseColor = {
      note: new THREE.Color(0x00ffff), // Cyan
      chord: new THREE.Color(0xff00ff), // Magenta
      beat: new THREE.Color(0xffff00), // Yellow
      loop: new THREE.Color(0x00ff00), // Green
    }[soundType]

    if (soundType === 'chord') {
      // Glass-like material for chords
      return (
        <MeshTransmissionMaterial
          color={baseColor}
          transmission={0.9}
          thickness={0.5}
          roughness={0.1}
          chromaticAberration={0.5}
          anisotropy={0.3}
          distortion={0.5}
          distortionScale={0.5}
          temporalDistortion={0.2}
        />
      )
    }

    // Custom shader material for other types
    return new THREE.ShaderMaterial({
      uniforms: {
        ...uniforms,
        baseColor: { value: baseColor },
        emissiveIntensity: { value: 0.5 },
      },
      vertexShader: `
        uniform float time;
        uniform float audioLevel;
        uniform float distortion;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          
          // Audio-reactive vertex displacement
          vec3 pos = position;
          float displacement = sin(position.x * 10.0 + time) * 
                              cos(position.y * 10.0 + time * 0.7) * 
                              sin(position.z * 10.0 + time * 1.3) * 
                              audioLevel * distortion * 0.1;
          
          pos += normal * displacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float audioLevel;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        uniform float colorShift;
        uniform vec3 baseColor;
        uniform float emissiveIntensity;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          // Dynamic color based on audio
          float hue = atan(baseColor.r, baseColor.g) / 6.28318 + colorShift + time * 0.1;
          float saturation = 0.8 + midLevel * 0.2;
          float value = 0.7 + audioLevel * 0.3;
          
          vec3 color = hsv2rgb(vec3(hue, saturation, value));
          
          // Rim lighting
          float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
          rim = pow(rim, 2.0);
          color += vec3(1.0, 1.0, 1.0) * rim * trebleLevel;
          
          // Emissive glow
          vec3 emissive = baseColor * emissiveIntensity * (0.5 + bassLevel);
          color += emissive;
          
          // Fresnel effect
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          color = mix(color, vec3(1.0), fresnel * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [soundType, uniforms])

  // Animate based on audio
  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Update uniforms
    uniforms.time.value += delta
    
    if (fftData && fftData.length > 0) {
      // Calculate frequency bands
      const bassEnd = Math.floor(fftData.length * 0.1)
      const midEnd = Math.floor(fftData.length * 0.5)
      
      const bass = fftData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
      const mid = fftData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255
      const treble = fftData.slice(midEnd).reduce((a, b) => a + b, 0) / (fftData.length - midEnd) / 255
      
      uniforms.bassLevel.value = bass
      uniforms.midLevel.value = mid
      uniforms.trebleLevel.value = treble
      uniforms.audioLevel.value = (bass + mid + treble) / 3
    }

    // Shape-specific animations
    const scale = 1 + uniforms.bassLevel.value * 0.2
    meshRef.current.scale.setScalar(scale)

    // Rotation based on type and audio
    switch (type) {
      case 'torus':
      case 'octahedron':
        meshRef.current.rotation.x += delta * (0.5 + uniforms.midLevel.value)
        meshRef.current.rotation.y += delta * (0.3 + uniforms.trebleLevel.value)
        break
      case 'icosahedron':
      case 'dodecahedron':
        meshRef.current.rotation.x = Math.sin(uniforms.time.value * 0.5) * 0.5
        meshRef.current.rotation.y += delta * (0.2 + uniforms.audioLevel.value)
        meshRef.current.rotation.z = Math.cos(uniforms.time.value * 0.3) * 0.3
        break
      default:
        meshRef.current.rotation.y += delta * 0.5
    }

    // Pulsing emissive effect
    if (materialRef.current && 'emissiveIntensity' in materialRef.current) {
      materialRef.current.emissiveIntensity = 0.5 + Math.sin(uniforms.time.value * 2) * 0.3 * uniforms.audioLevel.value
    }

    // Distortion for beat objects
    if (soundType === 'beat') {
      uniforms.distortion.value = Math.sin(uniforms.time.value * 10) * uniforms.bassLevel.value
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={geometry}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      {soundType === 'chord' ? material : <primitive object={material} ref={materialRef} />}
    </mesh>
  )
}

// Particle system for note visualization
export function NoteParticles({ position, color }: { position: THREE.Vector3; color: THREE.Color }) {
  const particlesRef = useRef<THREE.Points>(null)
  const startTime = useRef(Date.now())

  const [positions, velocities] = useMemo(() => {
    const count = 50
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Start from the note position
      pos[i3] = position.x
      pos[i3 + 1] = position.y
      pos[i3 + 2] = position.z

      // Random velocities in a sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 0.5 + Math.random() * 1.5

      vel[i3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i3 + 2] = Math.cos(phi) * speed
    }

    return [pos, vel]
  }, [position])

  useFrame(() => {
    if (!particlesRef.current) return

    const elapsed = (Date.now() - startTime.current) / 1000
    const geometry = particlesRef.current.geometry
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3
      positionAttribute.array[i3] = positions[i3] + velocities[i3] * elapsed
      positionAttribute.array[i3 + 1] = positions[i3 + 1] + velocities[i3 + 1] * elapsed - 0.5 * elapsed * elapsed
      positionAttribute.array[i3 + 2] = positions[i3 + 2] + velocities[i3 + 2] * elapsed
    }

    positionAttribute.needsUpdate = true

    // Fade out
    const material = particlesRef.current.material as THREE.PointsMaterial
    material.opacity = Math.max(0, 1 - elapsed / 2)

    // Remove after 2 seconds
    if (elapsed > 2) {
      particlesRef.current.visible = false
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}