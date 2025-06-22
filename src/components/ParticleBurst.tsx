'use client'
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GPUComputationRenderer,
  type Variable,
} from 'three/examples/jsm/misc/GPUComputationRenderer'
import { beatBus } from '../lib/events'
import { PARTICLE_COUNT_HIGH } from '../config/constants'

export interface ParticleBurstProps {
  count?: number
  color?: THREE.ColorRepresentation
}

export interface ParticleBurstHandle {
  burst: () => void
}

const positionFragment = /* glsl */`
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform float delta;
  void main(){
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 pos = texture2D( texturePosition, uv ).xyz;
    vec3 vel = texture2D( textureVelocity, uv ).xyz;
    gl_FragColor = vec4( pos + vel * delta, 1.0 );
  }
`

const velocityFragment = /* glsl */`
  uniform sampler2D texturePosition;
  uniform sampler2D textureVelocity;
  uniform float delta;
  uniform float burst;
  float rand(vec2 co){
    return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 pos = texture2D( texturePosition, uv ).xyz;
    vec3 vel = texture2D( textureVelocity, uv ).xyz * 0.98;
    if(burst>0.0){
      vel += normalize(pos+0.0001)*burst*5.0;
      vel += vec3(rand(uv),rand(uv*1.3),rand(uv*2.1))*2.0*burst;
    }
    gl_FragColor = vec4( vel, 1.0 );
  }
`

const renderVertex = /* glsl */`
  uniform sampler2D positions;
  varying vec2 vUv;
  void main(){
    vUv = uv;
    vec3 pos = texture2D( positions, uv ).xyz;
    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 2.0;
  }
`

const renderFragment = /* glsl */`
  uniform vec3 color;
  varying vec2 vUv;
  void main(){
    gl_FragColor = vec4( color, 1.0 );
  }
`

const ParticleBurst = forwardRef<ParticleBurstHandle, ParticleBurstProps>(
  ({ count = PARTICLE_COUNT_HIGH, color = '#ff88aa' }, ref) => {
    const { gl } = useThree()
    const size = Math.ceil(Math.sqrt(count))
    const gpu = useRef<GPUComputationRenderer | null>(null)
    const posVar = useRef<Variable | null>(null)
    const velVar = useRef<Variable | null>(null)
    const meshRef = useRef<THREE.Points>(null)

    const burst = () => {
      if (velVar.current) velVar.current.material.uniforms.burst.value = 1
    }

    useImperativeHandle(ref, () => ({ burst }))

    useEffect(() => {
      const compute = new GPUComputationRenderer(size, size, gl)
      const dtPos = compute.createTexture()
      const dtVel = compute.createTexture()
      const fill = (tex: THREE.DataTexture) => {
        const arr = tex.image.data as Float32Array
        for (let i = 0; i < arr.length; i += 4) {
          arr[i] = (Math.random() - 0.5) * 4
          arr[i + 1] = (Math.random() - 0.5) * 4
          arr[i + 2] = (Math.random() - 0.5) * 4
          arr[i + 3] = 1
        }
      }
      fill(dtPos)
      fill(dtVel)
      posVar.current = compute.addVariable('texturePosition', positionFragment, dtPos)
      velVar.current = compute.addVariable('textureVelocity', velocityFragment, dtVel)
      compute.setVariableDependencies(posVar.current, [posVar.current, velVar.current])
      compute.setVariableDependencies(velVar.current, [posVar.current, velVar.current])
      velVar.current.material.uniforms.delta = { value: 0 }
      velVar.current.material.uniforms.burst = { value: 0 }
      posVar.current.material.uniforms.delta = { value: 0 }
      const err = compute.init()
      if (err) console.error(err)
      gpu.current = compute
    }, [gl, size])

    useFrame((state) => {
      const compute = gpu.current
      if (!compute || !posVar.current || !velVar.current) return
      const delta = state.clock.getDelta()
      velVar.current.material.uniforms.delta.value = delta
      posVar.current.material.uniforms.delta.value = delta
      compute.compute()
      velVar.current.material.uniforms.burst.value = 0
      const mat = meshRef.current!.material as THREE.ShaderMaterial
      mat.uniforms.positions.value = compute.getCurrentRenderTarget(posVar.current).texture
    })

    useEffect(() => {
      const handler = () => burst()
      beatBus.addEventListener('beat', handler)
      return () => beatBus.removeEventListener('beat', handler)
    }, [])

    const geometry = React.useMemo(() => {
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array(size * size * 3)
      const uvs = new Float32Array(size * size * 2)
      let p = 0
      let u = 0
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          positions[p++] = 0
          positions[p++] = 0
          positions[p++] = 0
          uvs[u++] = i / size
          uvs[u++] = j / size
        }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      return geo
    }, [size])

    return (
      <points ref={meshRef} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          uniforms={{ positions: { value: null }, color: { value: new THREE.Color(color) } }}
          vertexShader={renderVertex}
          fragmentShader={renderFragment}
          transparent
        />
      </points>
    )
  }
)
ParticleBurst.displayName = 'ParticleBurst'
export default ParticleBurst
