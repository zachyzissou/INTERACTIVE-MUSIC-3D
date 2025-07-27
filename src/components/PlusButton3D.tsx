'use client'
import { useThree, useFrame } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
// import vertex from '@/shaders/plusButton.vert'
// import fragment from '@/shaders/plusButton.frag'

export default function PlusButton3D() {
  const { viewport } = useThree()
  const spawn = useObjects(s => s.spawn)
  const select = useSelectedShape(s => s.selectShape)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const [springs, api] = useSpring(() => ({ scale: 1, distort: 0 }))
  const [busy, setBusy] = useState(false)

  const pos: [number, number, number] = [-6, -2, 2] // Fixed position, more centered


  useFrame(() => {
    if (mat.current) mat.current.uniforms.uDistort.value = springs.distort.get()
  })

  const AnimatedMesh: any = (animated as any).mesh

  return (
    <AnimatedMesh
      position={pos}
      scale={springs.scale}
      onClick={async () => {
        if (busy) return
        setBusy(true)
        api.start({ distort: 1, scale: 0, config: { duration: 400 }, onRest: () => {
          const id = spawn('note')
          select(id)
          api.set({ scale: 1, distort: 0 })
          setBusy(false)
        } })
      }}
    >
      <planeGeometry args={[3,3]} />
      <meshBasicMaterial 
        color="#ff0000" 
        transparent 
        opacity={1.0}
      />
      </AnimatedMesh>
  )
}
