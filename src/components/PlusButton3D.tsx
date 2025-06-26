'use client'
import { useThree, useFrame } from '@react-three/fiber'
import { a, useSpring } from '@react-spring/three'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import { startAudio } from '@/lib/audio/startAudio'
import vertex from '@/shaders/plusButton.vert.glsl?raw'
import fragment from '@/shaders/plusButton.frag.glsl?raw'

export default function PlusButton3D() {
  const { viewport } = useThree()
  const spawn = useObjects(s => s.spawn)
  const select = useSelectedShape(s => s.selectShape)
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const [springs, api] = useSpring(() => ({ scale: 1, distort: 0 }))
  const [busy, setBusy] = useState(false)

  const pos: [number, number, number] = [
    -viewport.width / 2 + 0.8,
    -viewport.height / 2 + 0.8,
    0,
  ]


  useFrame(() => {
    if (mat.current) mat.current.uniforms.uDistort.value = springs.distort.get()
  })

  return (
    <a.mesh
      position={pos}
      scale={springs.scale}
      onClick={async () => {
        if (busy) return
        setBusy(true)
        await startAudio()
        api.start({ distort: 1, scale: 0, config: { duration: 400 }, onRest: () => {
          const id = spawn('note')
          select(id)
          api.set({ scale: 1, distort: 0 })
          setBusy(false)
        } })
      }}
    >
      <planeGeometry args={[1,1]} />
      <shaderMaterial
        ref={mat}
        transparent
        uniforms={{
          uDistort: { value: 0 },
          uColor: { value: new THREE.Color('#4fa3ff') },
        }}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </a.mesh>
  )
}
