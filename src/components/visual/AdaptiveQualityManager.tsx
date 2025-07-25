'use client'
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePerformanceSettings } from '@/store/usePerformanceSettings'
import { performanceOptimizer } from '@/lib/performance-optimizer'

interface AdaptiveQualityProps {
  children: React.ReactNode
}

export default function AdaptiveQualityManager({ children }: AdaptiveQualityProps) {
  const { gl, scene, camera } = useThree()
  const { level, setLevel } = usePerformanceSettings()
  const frameTimeRef = useRef<number[]>([])
  const lastUpdateRef = useRef(0)
  const qualityRef = useRef(1.0)

  // Initialize performance optimizer
  useEffect(() => {
    const initOptimizer = async () => {
      try {
        await performanceOptimizer.detectCapabilities()
        const recommendedLevel = performanceOptimizer.getRecommendedPerformanceLevel()
        
        // Only update if user hasn't manually set performance level
        if (level === 'medium') {
          setLevel(recommendedLevel)
        }
      } catch (error) {
        console.warn('Failed to detect device capabilities:', error)
      }
    }

    initOptimizer()
  }, [level, setLevel])

  // Dynamic quality adjustment
  useFrame((state, delta) => {
    const now = performance.now()
    const frameTime = delta * 1000

    // Track frame times
    frameTimeRef.current.push(frameTime)
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift()
    }

    // Update performance optimizer with current FPS
    const fps = 1000 / frameTime
    performanceOptimizer.trackFrameRate(fps)

    // Adaptive quality scaling every 2 seconds
    if (now - lastUpdateRef.current > 2000 && frameTimeRef.current.length >= 30) {
      lastUpdateRef.current = now

      const avgFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length
      const avgFPS = 1000 / avgFrameTime
      const qualityMultiplier = performanceOptimizer.getDynamicQualityMultiplier()

      // Apply quality adjustments
      if (Math.abs(qualityMultiplier - qualityRef.current) > 0.1) {
        qualityRef.current = qualityMultiplier
        applyQualitySettings(qualityMultiplier)
      }
    }
  })

  const applyQualitySettings = (quality: number) => {
    // Adjust pixel ratio
    const targetPixelRatio = Math.min(window.devicePixelRatio, 2) * quality
    gl.setPixelRatio(Math.max(0.5, Math.min(2, targetPixelRatio)))

    // Adjust shadow map size
    if (gl.shadowMap) {
      const shadowMapSize = Math.floor(1024 * quality)
      gl.shadowMap.setSize(shadowMapSize, shadowMapSize)
    }

    // Adjust antialias (for next frame)
    const shouldAntialias = quality > 0.8 && level !== 'low'
    if (gl.getContextAttributes()?.antialias !== shouldAntialias) {
      // Note: WebGL context antialias cannot be changed after creation
      console.log(`Quality: ${quality.toFixed(2)}, Would set antialias: ${shouldAntialias}`)
    }
  }

  return <>{children}</>
}

// LOD (Level of Detail) component for objects
export function LODObject({ 
  children, 
  distance = 10,
  highDetail,
  mediumDetail,
  lowDetail 
}: {
  children?: React.ReactNode
  distance?: number
  highDetail?: React.ReactNode
  mediumDetail?: React.ReactNode
  lowDetail?: React.ReactNode
}) {
  const meshRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!meshRef.current) return

    const distanceToCamera = camera.position.distanceTo(meshRef.current.position)
    const settings = performanceOptimizer.getRecommendedSettings()
    
    if (!settings?.lodEnabled) return

    // Hide distant objects entirely if performance is poor
    const qualityMultiplier = performanceOptimizer.getDynamicQualityMultiplier()
    const maxDistance = distance * qualityMultiplier * 2

    if (distanceToCamera > maxDistance) {
      meshRef.current.visible = false
      return
    }

    meshRef.current.visible = true

    // Switch LOD based on distance and performance
    const lodThreshold1 = distance * qualityMultiplier
    const lodThreshold2 = distance * qualityMultiplier * 1.5

    // This would need more complex implementation to actually switch geometry
    // For now, just adjust scale based on distance for performance
    if (distanceToCamera > lodThreshold2) {
      meshRef.current.scale.setScalar(0.5) // Low detail
    } else if (distanceToCamera > lodThreshold1) {
      meshRef.current.scale.setScalar(0.75) // Medium detail
    } else {
      meshRef.current.scale.setScalar(1.0) // High detail
    }
  })

  return (
    <group ref={meshRef}>
      {children}
      {/* Future: implement actual LOD geometry switching */}
    </group>
  )
}

// Frustum culling component
export function FrustumCulled({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const frustum = useRef(new THREE.Frustum())
  const matrix = useRef(new THREE.Matrix4())

  useFrame(() => {
    if (!groupRef.current) return
    
    const settings = performanceOptimizer.getRecommendedSettings()
    if (!settings?.frustumCulling) return

    // Update frustum
    matrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.current.setFromProjectionMatrix(matrix.current)

    // Check if object is in frustum
    const sphere = new THREE.Sphere(groupRef.current.position, 2) // Rough bounding sphere
    groupRef.current.visible = frustum.current.intersectsSphere(sphere)
  })

  return <group ref={groupRef}>{children}</group>
}

// Performance monitoring component
export function PerformanceMonitor() {
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useFrame(() => {
    frameCountRef.current++
    const now = performance.now()

    // Log performance metrics every 5 seconds
    if (now - lastTimeRef.current > 5000) {
      const fps = (frameCountRef.current * 1000) / (now - lastTimeRef.current)
      const capabilities = performanceOptimizer.getCapabilities()
      const settings = performanceOptimizer.getRecommendedSettings()

      console.log('🔍 Performance Monitor:', {
        fps: fps.toFixed(1),
        quality: performanceOptimizer.getDynamicQualityMultiplier().toFixed(2),
        gpu: capabilities?.gpu,
        particles: settings?.maxParticles,
        shadows: settings?.shadowQuality
      })

      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return null
}