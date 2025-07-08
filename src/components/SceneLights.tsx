'use client'
import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

export default function SceneLights() {
  const { scene } = useThree()
  const lightsRef = useRef<THREE.Light[]>([])

  useEffect(() => {
    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    const pointLight = new THREE.PointLight(0xffffff, 0.5)

    // Set positions
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    pointLight.position.set(0, 5, -5)

    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50

    // Add to scene
    const lights = [ambientLight, directionalLight, pointLight]
    lights.forEach(light => scene.add(light))
    lightsRef.current = lights

    return () => {
      // Cleanup
      lights.forEach(light => scene.remove(light))
    }
  }, [scene])

  return null
}
