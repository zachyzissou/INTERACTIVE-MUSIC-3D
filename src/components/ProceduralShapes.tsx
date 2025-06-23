'use client'
import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { animate } from '@motionone/dom'
import { subscribeToAudioLevel } from '../lib/analyser'

const ProceduralShapes = () => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const amplitude = useRef(0)

  useEffect(() => {
    const unsub = subscribeToAudioLevel((level) => {
      const start = amplitude.current
      const diff = level - start
      const startTime = performance.now()
      const duration = 100
      const step = (t: number) => {
        const progress = Math.min((t - startTime) / duration, 1)
        amplitude.current = start + diff * progress
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
    return unsub
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const scale = 1 + amplitude.current * 0.5
    meshRef.current.scale.setScalar(scale)
    meshRef.current.rotation.y += 0.01
  })

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]} position={[0, 0, 0]}>
      <meshStandardMaterial attach="material" color="royalblue" />
    </Sphere>
  )
}

export default ProceduralShapes
