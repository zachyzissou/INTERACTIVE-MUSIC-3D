'use client'
import React, { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { PerspectiveCamera, AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import AnimatedGradient from './AnimatedGradient'
import MusicalObject from './MusicalObject'
import PlusButton3D from './PlusButton3D'

function ResizeHandler() {
  const { camera, gl } = useThree()
  React.useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if ('aspect' in camera) {
        (camera as THREE.PerspectiveCamera).aspect = w / h
        camera.updateProjectionMatrix()
      }
      gl.setSize(w, h)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [camera, gl])
  return null
}

export default function CanvasScene() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('CanvasScene mounted')
    }
  }, [])
  return (
    <Canvas className="w-full h-full" shadows>
      <AdaptiveDpr pixelated />
      <AnimatedGradient />
      <ResizeHandler />
      <Physics>
        <PerspectiveCamera makeDefault fov={50} position={[0,5,10]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5,10,5]} intensity={0.8} castShadow />
        <pointLight position={[0,5,-5]} intensity={0.5} />
        <Suspense fallback={null}>
          <MusicalObject />
        </Suspense>
      </Physics>
      <PlusButton3D />
    </Canvas>
  )
}
