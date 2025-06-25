'use client'
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { GradientTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function AnimatedGradient() {
  const colors = useMemo(() => [new THREE.Color('#ff0080'), new THREE.Color('#00ccff')], [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.05
    colors[0].setHSL((t % 1), 0.5, 0.5)
    colors[1].setHSL(((t + 0.5) % 1), 0.5, 0.5)
  })
  return (
    <mesh position={[0, 0, -10]} scale={[50, 50, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial>
        {/* GradientTexture uses the mutable THREE.Color objects */}
        <GradientTexture stops={[0, 1]} colors={colors as any} />
      </meshBasicMaterial>
    </mesh>
  )
}
