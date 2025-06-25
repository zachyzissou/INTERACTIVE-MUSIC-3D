'use client'
import React, { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useObjects } from '@/store/useObjects'
import { useSelectedShape } from '@/store/useSelectedShape'
import { triggerSound } from '@/lib/soundTriggers'
import { startNote } from '@/lib/audio'

/**
 * 3D plus button that morphs into a sphere when clicked.
 * After the warp animation completes, a new musical object is spawned
 * and selected.
 */
export default function SpawnMeshButton() {
  const { viewport } = useThree()
  const spawn = useObjects(s => s.spawn)
  const select = useSelectedShape(s => s.selectShape)
  const meshRef = useRef<THREE.Mesh>(null!)
  const prog = useRef(0)
  const [animating, setAnimating] = useState(false)

  // Geometry with start positions forming a plus sign
  const geometry = React.useMemo(() => {
    const geom = new THREE.IcosahedronGeometry(0.4, 3)
    const pos = geom.attributes.position as THREE.BufferAttribute
    const start = new Float32Array(pos.array.length)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const signX = Math.sign(x) || 1
      const signY = Math.sign(y) || 1
      let sx = 0, sy = 0
      if (Math.abs(x) > Math.abs(y)) {
        sx = 0.3 * signX
        sy = 0.1 * y
      } else {
        sx = 0.1 * x
        sy = 0.3 * signY
      }
      start[i * 3] = sx
      start[i * 3 + 1] = sy
      start[i * 3 + 2] = 0
    }
    geom.setAttribute('startPosition', new THREE.BufferAttribute(start, 3))
    return geom
  }, [])

  const matRef = useRef<THREE.ShaderMaterial>(null!)

  useFrame((_, delta) => {
    if (!animating) return
    prog.current = Math.min(1, prog.current + delta)
    matRef.current.uniforms.uProgress.value = prog.current
    if (prog.current >= 1) {
      const id = spawn('note')
      select(id)
      triggerSound('note', id)
      prog.current = 0
      matRef.current.uniforms.uProgress.value = 0
      setAnimating(false)
    }
  })

  const handleClick = async () => {
    if (animating) return
    await startNote('C5')
    setAnimating(true)
  }

  const pos: [number, number, number] = [
    -viewport.width / 2 + 0.8,
    -viewport.height / 2 + 0.8,
    0,
  ]

  return (
    <mesh ref={meshRef} position={pos} onClick={handleClick}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={matRef}
        uniforms={{ uProgress: { value: 0 } }}
        vertexShader={`
          attribute vec3 startPosition;
          uniform float uProgress;
          varying vec3 vNormal;
          void main() {
            vec3 p = mix(startPosition, position, uProgress);
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          void main(){
            float shade = dot(normalize(vNormal), vec3(0.3,0.6,1.0));
            gl_FragColor = vec4(vec3(0.6,0.8,1.0)*shade,1.0);
          }
        `}
      />
    </mesh>
  )
}
