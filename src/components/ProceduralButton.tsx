'use client'
import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PLANE_SIZE } from '../config/constants'

interface ProceduralButtonProps {
  position?: [number, number, number]
  color?: string
  hover?: boolean
  active?: boolean
  pulse?: number
}

const ProceduralButton: React.FC<ProceduralButtonProps> = ({
  position = [0, 0, 0],
  color = '#4fa3ff',
  hover = false,
  active = false,
  pulse = 0,
}) => {
  const mat = useRef<THREE.ShaderMaterial>(null!)

  useFrame(({ clock }) => {
    if (!mat.current) return
    const m = mat.current
    m.uniforms.uTime.value = clock.getElapsedTime()
    m.uniforms.uHover.value = THREE.MathUtils.lerp(
      m.uniforms.uHover.value,
      hover ? 1 : 0,
      0.1,
    )
    m.uniforms.uActive.value = THREE.MathUtils.lerp(
      m.uniforms.uActive.value,
      active ? 1 : 0,
      0.1,
    )
  })

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
      <shaderMaterial
        ref={mat}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uHover: { value: hover ? 1 : 0 },
          uActive: { value: active ? 1 : 0 },
          uColor: { value: new THREE.Color(color) },
          uPulse: { value: pulse },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={`
          precision mediump float;
          varying vec2 vUv;
          uniform float uTime;
          uniform float uHover;
          uniform float uActive;
          uniform vec3 uColor;
          uniform float uPulse;

          float sdRoundedBox( vec2 p, vec2 b, float r ) {
            vec2 d = abs(p) - b + r;
            return length(max(d,0.0)) - r;
          }

          void main(){
            vec2 p = vUv - 0.5;
            float osc = sin(uTime*4.0) * 0.5 + 0.5;
            float expand = uHover*0.05 + uActive*(0.1 + osc * uPulse * 0.05);
            float d = sdRoundedBox(p, vec2(0.35,0.15), 0.1 + expand);
            float alpha = smoothstep(0.005, 0.0, d);
            vec3 col = uColor + uHover*0.2 + uActive*0.3;
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  )
}

export default ProceduralButton
