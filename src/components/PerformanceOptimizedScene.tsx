'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, Matrix4, Color, Vector3 } from 'three'
import { Detailed } from '@react-three/drei'
import * as THREE from 'three'

interface PerformanceOptimizedSceneProps {
  audioData: {
    bass: number
    mid: number
    high: number
    spectrum: Float32Array
  }
  performanceLevel: 'low' | 'medium' | 'high'
  objectCount: number
}

// Reusable geometry instances to avoid recreation
const geometryCache = new Map()

const getGeometry = (type: string, ...args: any[]) => {
  const key = `${type}-${args.join('-')}`
  if (!geometryCache.has(key)) {
    switch (type) {
      case 'sphere':
        geometryCache.set(key, new THREE.SphereGeometry(...args))
        break
      case 'box':
        geometryCache.set(key, new THREE.BoxGeometry(...args))
        break
      case 'cylinder':
        geometryCache.set(key, new THREE.CylinderGeometry(...args))
        break
      default:
        geometryCache.set(key, new THREE.SphereGeometry(0.5, 8, 8))
    }
  }
  return geometryCache.get(key)
}

// Material cache to avoid recreation
const materialCache = new Map()

const getMaterial = (type: string, options: any = {}) => {
  const key = `${type}-${JSON.stringify(options)}`
  if (!materialCache.has(key)) {
    switch (type) {
      case 'standard':
        materialCache.set(key, new THREE.MeshStandardMaterial(options))
        break
      case 'basic':
        materialCache.set(key, new THREE.MeshBasicMaterial(options))
        break
      case 'lambert':
        materialCache.set(key, new THREE.MeshLambertMaterial(options))
        break
      default:
        materialCache.set(key, new THREE.MeshStandardMaterial(options))
    }
  }
  return materialCache.get(key)
}

// LOD (Level of Detail) component for performance scaling
const AudioReactiveInstancedMesh: React.FC<{
  count: number
  audioData: any
  performanceLevel: string
}> = ({ count, audioData, performanceLevel }) => {
  const meshRef = useRef<InstancedMesh>(null)
  const tempObject = useMemo(() => new Object3D(), [])
  const tempMatrix = useMemo(() => new Matrix4(), [])
  const tempColor = useMemo(() => new Color(), [])
  const tempVector = useMemo(() => new Vector3(), [])
  
  // Performance-based geometry selection
  const geometry = useMemo(() => {
    switch (performanceLevel) {
      case 'low':
        return getGeometry('sphere', 0.3, 4, 4) // Low poly
      case 'medium':
        return getGeometry('sphere', 0.3, 8, 8) // Medium poly
      case 'high':
        return getGeometry('sphere', 0.3, 16, 16) // High poly
      default:
        return getGeometry('sphere', 0.3, 8, 8)
    }
  }, [performanceLevel])
  
  // Performance-based material selection
  const material = useMemo(() => {
    const baseColor = new Color(0x4f46e5)
    switch (performanceLevel) {
      case 'low':
        return getMaterial('basic', { color: baseColor, wireframe: false })
      case 'medium':
        return getMaterial('lambert', { color: baseColor })
      case 'high':
        return getMaterial('standard', { 
          color: baseColor, 
          metalness: 0.6, 
          roughness: 0.4,
          envMapIntensity: 0.5
        })
      default:
        return getMaterial('standard', { color: baseColor })
    }
  }, [performanceLevel])
  
  // Initialize positions
  const positions = useMemo(() => {
    const pos = []
    for (let i = 0; i < count; i++) {
      pos.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
        phase: Math.random() * Math.PI * 2,
        frequency: 0.5 + Math.random() * 2
      })
    }
    return pos
  }, [count])
  
  useFrame((state) => {
    if (!meshRef.current) return
    
    const time = state.clock.elapsedTime
    const bassEnergy = audioData.bass || 0
    const midEnergy = audioData.mid || 0
    const highEnergy = audioData.high || 0
    
    // Update instances based on audio data
    for (let i = 0; i < count; i++) {
      const pos = positions[i]
      
      // Audio-reactive animation
      const audioInfluence = (audioData.spectrum?.[i % 32] || 0) + bassEnergy * 0.3
      
      // Position animation
      tempObject.position.set(
        pos.x + Math.sin(time * pos.frequency + pos.phase) * audioInfluence * 2,
        pos.y + Math.cos(time * pos.frequency * 0.8 + pos.phase) * audioInfluence * 2,
        pos.z + Math.sin(time * pos.frequency * 0.6 + pos.phase) * audioInfluence
      )
      
      // Scale based on audio
      const scale = 0.5 + audioInfluence * 1.5
      tempObject.scale.setScalar(scale)
      
      // Rotation
      tempObject.rotation.x = time * 0.5 + pos.phase
      tempObject.rotation.y = time * 0.3 + pos.phase * 0.5
      tempObject.rotation.z = time * 0.2 + pos.phase * 0.3
      
      tempObject.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObject.matrix)
      
      // Color based on frequency
      const hue = (i / count + time * 0.1) % 1
      const saturation = 0.7 + audioInfluence * 0.3
      const lightness = 0.5 + midEnergy * 0.3
      
      tempColor.setHSL(hue, saturation, lightness)
      meshRef.current.setColorAt(i, tempColor)
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={true}
    />
  )
}

// Optimized particle system using Points
const OptimizedParticleSystem: React.FC<{
  count: number
  audioData: any
  performanceLevel: string
}> = ({ count, audioData, performanceLevel }) => {
  const pointsRef = useRef<THREE.Points>(null)
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // Random sphere distribution
      const radius = Math.random() * 25
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      // Initialize colors
      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()
    }
    
    return { positions, colors }
  }, [count])
  
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geom
  }, [positions, colors])
  
  const material = useMemo(() => {
    const size = performanceLevel === 'low' ? 2 : performanceLevel === 'medium' ? 3 : 4
    return new THREE.PointsMaterial({
      size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })
  }, [performanceLevel])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const time = state.clock.elapsedTime
    const positionAttribute = pointsRef.current.geometry.getAttribute('position')
    const colorAttribute = pointsRef.current.geometry.getAttribute('color')
    
    const bassEnergy = audioData.bass || 0
    const spectrum = audioData.spectrum || new Float32Array(32)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Get original position
      const x = positions[i3]
      const y = positions[i3 + 1]
      const z = positions[i3 + 2]
      
      // Audio-reactive movement
      const audioInfluence = spectrum[i % 32] + bassEnergy * 0.2
      const movement = Math.sin(time + i * 0.1) * audioInfluence * 2
      
      positionAttribute.setXYZ(
        i,
        x + movement,
        y + Math.cos(time * 0.5 + i * 0.05) * audioInfluence,
        z + movement * 0.5
      )
      
      // Audio-reactive colors
      const hue = (time * 0.1 + i * 0.01) % 1
      colorAttribute.setXYZ(
        i,
        hue,
        0.8 + audioInfluence * 0.2,
        0.6 + bassEnergy * 0.4
      )
    }
    
    positionAttribute.needsUpdate = true
    colorAttribute.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef} geometry={geometry} material={material} />
  )
}

// Main performance optimized scene component
const PerformanceOptimizedScene: React.FC<PerformanceOptimizedSceneProps> = ({
  audioData,
  performanceLevel,
  objectCount
}) => {
  // Adjust counts based on performance level
  const counts = useMemo(() => {
    const baseCount = objectCount
    switch (performanceLevel) {
      case 'low':
        return {
          instances: Math.min(baseCount, 50),
          particles: Math.min(baseCount * 2, 200)
        }
      case 'medium':
        return {
          instances: Math.min(baseCount, 100),
          particles: Math.min(baseCount * 3, 500)
        }
      case 'high':
        return {
          instances: Math.min(baseCount, 200),
          particles: Math.min(baseCount * 5, 1000)
        }
      default:
        return {
          instances: 100,
          particles: 500
        }
    }
  }, [performanceLevel, objectCount])
  
  return (
    <group>
      {/* LOD system for different detail levels */}
      <Detailed distances={[0, 50, 100]}>
        {/* High detail - close up */}
        <AudioReactiveInstancedMesh
          count={counts.instances}
          audioData={audioData}
          performanceLevel="high"
        />
        
        {/* Medium detail - medium distance */}
        <AudioReactiveInstancedMesh
          count={Math.floor(counts.instances * 0.7)}
          audioData={audioData}
          performanceLevel="medium"
        />
        
        {/* Low detail - far away */}
        <OptimizedParticleSystem
          count={counts.particles}
          audioData={audioData}
          performanceLevel="low"
        />
      </Detailed>
      
      {/* Always render particle system for ambient effect */}
      <OptimizedParticleSystem
        count={counts.particles}
        audioData={audioData}
        performanceLevel={performanceLevel}
      />
    </group>
  )
}

export default PerformanceOptimizedScene