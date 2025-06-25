'use client'
import { useThree, useFrame } from '@react-three/fiber'
import { a, useSpring } from '@react-spring/three'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import { startNote } from '@/lib/audio'

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
        await startNote('C5')
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
          uTime: { value: 0 },
          uDistort: { value: 0 },
          uColor: { value: new THREE.Color('#4fa3ff') },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={`
          precision highp float;
          varying vec2 vUv;
          uniform float uDistort;
          uniform vec3 uColor;
          float sdPlus(vec2 p,float b,float t){
            p=abs(p);
            p-=b;
            if(p.x<0.0||p.y<0.0) return max(p.x,p.y)-t;
            return length(max(p,0.0))-t;
          }
          void main(){
            vec2 p=vUv*2.0-1.0;
            float d=sdPlus(p,0.2,0.05-uDistort*0.05);
            float a=smoothstep(0.02,0.0,d);
            gl_FragColor=vec4(uColor,a);
          }
        `}
      />
    </a.mesh>
  )
}
