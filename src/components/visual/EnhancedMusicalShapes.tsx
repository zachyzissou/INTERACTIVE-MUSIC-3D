'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '@/store/useAudioEngine'
import { AdvancedMusicalMaterial, MaterialTypes } from './AdvancedMusicalMaterials'
import gsap from 'gsap'

// Enhanced shape types with more complex geometries
export type EnhancedShapeType = 
  | 'metaball' | 'fractal-sphere' | 'cymatic-disc' | 'plasma-torus' 
  | 'crystal-icosahedron' | 'liquid-cube' | 'holographic-dodecahedron'
  | 'audio-morph' | 'frequency-spline' | 'harmonic-spiral'

interface EnhancedShapeProps {
  type: EnhancedShapeType
  position: [number, number, number]
  soundType: 'note' | 'chord' | 'beat' | 'loop'
  noteValue?: string
  id: string
  materialType?: keyof typeof MaterialTypes
  onClick?: () => void
  scale?: number
  rotation?: [number, number, number]
}

export function EnhancedMusicalShape({ 
  type, 
  position, 
  soundType, 
  noteValue = 'C4', 
  id, 
  materialType = 'CYMATIC',
  onClick,
  scale = 1,
  rotation = [0, 0, 0]
}: EnhancedShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const { fftData, volume } = useAudioStore()
  
  // Audio analysis for shape morphing
  const audioData = useMemo(() => {
    if (!fftData || fftData.length === 0) return { bass: 0, mid: 0, treble: 0, amplitude: 0 }
    
    const bassEnd = Math.floor(fftData.length * 0.1)
    const midEnd = Math.floor(fftData.length * 0.5)
    
    const bass = fftData.slice(0, bassEnd).reduce((a, b) => a + b, 0) / bassEnd / 255
    const mid = fftData.slice(bassEnd, midEnd).reduce((a, b) => a + b, 0) / (midEnd - bassEnd) / 255
    const treble = fftData.slice(midEnd).reduce((a, b) => a + b, 0) / (fftData.length - midEnd) / 255
    const amplitude = (bass + mid + treble) / 3
    
    return { bass, mid, treble, amplitude }
  }, [fftData])

  // Create enhanced geometries
  const geometry = useMemo(() => {
    switch (type) {
      case 'metaball':
        // Create a high-resolution sphere for metaball effects
        return new THREE.SphereGeometry(1, 128, 128)
        
      case 'fractal-sphere':
        // Icosphere with fractal subdivision
        const geo = new THREE.IcosahedronGeometry(1, 4)
        const positions = geo.attributes.position
        const vertex = new THREE.Vector3()
        
        // Add fractal noise to vertices
        for (let i = 0; i < positions.count; i++) {
          vertex.fromBufferAttribute(positions, i)
          const noise = Math.sin(vertex.x * 4) * Math.cos(vertex.y * 4) * Math.sin(vertex.z * 4)
          vertex.normalize().multiplyScalar(1 + noise * 0.1)
          positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
        }
        
        geo.computeVertexNormals()
        return geo
        
      case 'cymatic-disc':
        // Circular geometry for cymatic patterns
        return new THREE.CylinderGeometry(1.5, 1.5, 0.1, 64, 16)
        
      case 'plasma-torus':
        // High-resolution torus for plasma effects
        return new THREE.TorusGeometry(1, 0.4, 32, 128)
        
      case 'crystal-icosahedron':
        // Sharp crystal geometry
        const crystalGeo = new THREE.IcosahedronGeometry(1, 1)
        // Extrude faces for crystalline look
        const modifier = new THREE.Vector3()
        const positions2 = crystalGeo.attributes.position
        
        for (let i = 0; i < positions2.count; i++) {
          modifier.fromBufferAttribute(positions2, i)
          modifier.normalize().multiplyScalar(1 + Math.random() * 0.2)
          positions2.setXYZ(i, modifier.x, modifier.y, modifier.z)
        }
        
        crystalGeo.computeVertexNormals()
        return crystalGeo
        
      case 'liquid-cube':
        // Rounded cube with liquid-like properties
        return new THREE.BoxGeometry(1.5, 1.5, 1.5, 32, 32, 32)
        
      case 'holographic-dodecahedron':
        return new THREE.DodecahedronGeometry(1, 2)
        
      case 'audio-morph':
        // Dynamic geometry that morphs based on audio
        const morphGeo = new THREE.SphereGeometry(1, 64, 64)
        morphGeo.morphAttributes.position = []
        
        // Create morph targets
        const morphTarget1 = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64).attributes.position
        const morphTarget2 = new THREE.ConeGeometry(1, 2, 64).attributes.position
        
        morphGeo.morphAttributes.position[0] = morphTarget1
        morphGeo.morphAttributes.position[1] = morphTarget2
        
        return morphGeo
        
      case 'frequency-spline':
        // Spline curve based on frequency data
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(1, 1, 0),
          new THREE.Vector3(2, 0, 1),
          new THREE.Vector3(3, -1, 0),
          new THREE.Vector3(4, 0, 0)
        ])
        return new THREE.TubeGeometry(curve, 64, 0.2, 16, false)
        
      case 'harmonic-spiral':
        // Spiral geometry based on harmonic series
        const points = []
        for (let i = 0; i < 200; i++) {
          const t = i / 200
          const angle = t * Math.PI * 8
          const radius = 1 - t * 0.8
          points.push(new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            (t - 0.5) * 2
          ))
        }
        const spiralCurve = new THREE.CatmullRomCurve3(points)
        return new THREE.TubeGeometry(spiralCurve, 100, 0.05, 8, false)
        
      default:
        return new THREE.SphereGeometry(1, 64, 64)
    }
  }, [type])

  // Enhanced animations with GSAP
  useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    
    // Initial spawn animation
    gsap.from(mesh.scale, {
      x: 0, y: 0, z: 0,
      duration: 1.5,
      ease: "elastic.out(1, 0.3)",
      delay: Math.random() * 0.5
    })

    gsap.from(mesh.rotation, {
      x: Math.PI * 2,
      y: Math.PI * 2,
      duration: 2,
      ease: "power3.out"
    })

    // Floating animation
    gsap.to(mesh.position, {
      y: mesh.position.y + 0.3,
      duration: 3 + Math.random() * 2,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    })

  }, [])

  // Audio-reactive animations
  useFrame((state, delta) => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const { bass, mid, treble, amplitude } = audioData

    // Scale pulsing based on audio
    const scaleMultiplier = scale * (1 + amplitude * 0.3)
    gsap.to(mesh.scale, {
      x: scaleMultiplier,
      y: scaleMultiplier,
      z: scaleMultiplier,
      duration: 0.1,
      ease: "power2.out"
    })

    // Type-specific audio reactivity
    switch (type) {
      case 'metaball':
        // Organic pulsing
        mesh.rotation.x += delta * (0.2 + bass * 0.5)
        mesh.rotation.y += delta * (0.3 + mid * 0.4)
        break
        
      case 'plasma-torus':
        // Rapid spinning for plasma effect
        mesh.rotation.x += delta * (2 + treble * 3)
        mesh.rotation.z += delta * (1.5 + mid * 2)
        break
        
      case 'cymatic-disc':
        // Vibration-like rotation
        mesh.rotation.z += delta * (bass * 10)
        break
        
      case 'crystal-icosahedron':
        // Crystalline precision rotation
        mesh.rotation.x = Math.sin(state.clock.elapsedTime * 2) * treble
        mesh.rotation.y += delta * 0.5
        mesh.rotation.z = Math.cos(state.clock.elapsedTime * 1.5) * mid
        break
        
      case 'audio-morph':
        // Morph between shapes based on audio
        if (mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences[0] = bass
          mesh.morphTargetInfluences[1] = treble
        }
        break
        
      case 'frequency-spline':
        // Undulating motion
        mesh.rotation.y += delta * (1 + amplitude * 2)
        mesh.position.y += Math.sin(state.clock.elapsedTime * 3 + bass * 5) * 0.01
        break
        
      case 'harmonic-spiral':
        // Spiral rotation
        mesh.rotation.z += delta * (0.5 + amplitude * 1.5)
        break
        
      default:
        mesh.rotation.y += delta * 0.5
    }

    // Universal wobble effect for high audio activity
    if (amplitude > 0.7) {
      mesh.rotation.x += Math.sin(state.clock.elapsedTime * 20) * amplitude * 0.02
      mesh.rotation.z += Math.cos(state.clock.elapsedTime * 15) * amplitude * 0.02
    }
  })

  // Material selection based on sound type and shape
  const getMaterialType = () => {
    if (materialType !== 'CYMATIC') return materialType

    // Auto-select material based on sound type and shape
    switch (soundType) {
      case 'note':
        return type.includes('crystal') ? MaterialTypes.CRYSTAL : MaterialTypes.HOLOGRAPHIC
      case 'chord':
        return MaterialTypes.LIQUID_METAL
      case 'beat':
        return type.includes('plasma') ? MaterialTypes.PLASMA : MaterialTypes.CYMATIC
      case 'loop':
        return MaterialTypes.CYMATIC
      default:
        return MaterialTypes.HOLOGRAPHIC
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={geometry}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      <AdvancedMusicalMaterial
        type={getMaterialType()}
        soundType={soundType}
        audioReactive={true}
      />
    </mesh>
  )
}

// Explosion particle system for beat feedback
export function BeatExplosion({ position, color, intensity = 1 }: { 
  position: THREE.Vector3
  color: THREE.Color
  intensity?: number 
}) {
  const particlesRef = useRef<THREE.Points>(null)
  const startTime = useRef(Date.now())

  const [positions, velocities, sizes] = useMemo(() => {
    const count = Math.floor(100 * intensity)
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const size = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Start from center
      pos[i3] = position.x
      pos[i3 + 1] = position.y
      pos[i3 + 2] = position.z

      // Explosive velocities
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 2 + Math.random() * 4

      vel[i3] = Math.sin(phi) * Math.cos(theta) * speed
      vel[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      vel[i3 + 2] = Math.cos(phi) * speed

      size[i] = 0.1 + Math.random() * 0.3
    }

    return [pos, vel, size]
  }, [position, intensity])

  useFrame(() => {
    if (!particlesRef.current) return

    const elapsed = (Date.now() - startTime.current) / 1000
    const geometry = particlesRef.current.geometry
    const positionAttribute = geometry.attributes.position as THREE.BufferAttribute
    const sizeAttribute = geometry.attributes.size as THREE.BufferAttribute

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3
      
      // Update positions with physics
      positionAttribute.array[i3] = positions[i3] + velocities[i3] * elapsed
      positionAttribute.array[i3 + 1] = positions[i3 + 1] + velocities[i3 + 1] * elapsed - 4.9 * elapsed * elapsed
      positionAttribute.array[i3 + 2] = positions[i3 + 2] + velocities[i3 + 2] * elapsed

      // Shrink particles over time
      sizeAttribute.array[i] = sizes[i] * Math.max(0, 1 - elapsed / 3)
    }

    positionAttribute.needsUpdate = true
    sizeAttribute.needsUpdate = true

    // Fade material
    const material = particlesRef.current.material as THREE.PointsMaterial
    material.opacity = Math.max(0, 1 - elapsed / 3)

    // Remove after 3 seconds
    if (elapsed > 3) {
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
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color={color}
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        vertexColors={false}
      />
    </points>
  )
}