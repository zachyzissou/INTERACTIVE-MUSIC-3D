// src/components/AudioVisualizer.tsx
import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import * as Tone from 'tone'

const AudioVisualizer: React.FC = () => {
  const { viewport } = useThree()
  const width = viewport.width
  const height = viewport.height
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const textureRef = useRef<THREE.DataTexture | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  // setup analyser and data texture once
  useEffect(() => {
    const ctx = Tone.getContext()
    const analyser = ctx.rawContext.createAnalyser()
    analyser.fftSize = 256
    ctx.destination.connect(analyser)
    analyserRef.current = analyser
    const bufLen = analyser.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufLen)
    const dataTex = new THREE.DataTexture(
      dataArrayRef.current,
      bufLen,
      1,
      THREE.RedFormat,
      THREE.UnsignedByteType
    )
    dataTex.minFilter = THREE.LinearFilter
    dataTex.magFilter = THREE.LinearFilter
    dataTex.wrapS = THREE.ClampToEdgeWrapping
    dataTex.wrapT = THREE.ClampToEdgeWrapping
    textureRef.current = dataTex
  }, [])

  // on each frame, update frequency data and shader uniforms
  useFrame(({ clock }) => {
    const analyser = analyserRef.current
    const dataArray = dataArrayRef.current
    const texture = textureRef.current
    if (analyser && dataArray && texture && materialRef.current) {
      analyser.getByteFrequencyData(dataArray)
      texture.needsUpdate = true
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uFreq.value = texture
    }
  })

  return (
    <>
      {/* orthographic camera for full-screen background */}
      <OrthographicCamera
        makeDefault
        left={-width / 2}
        right={width / 2}
        top={height / 2}
        bottom={-height / 2}
        near={0}
        far={100}
        position={[0, 0, 10]}
      />
      <mesh>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={{
            uTime: { value: 0 },
            uFreq: { value: null },
            uResolution: { value: new THREE.Vector2(width, height) }
          }}
          vertexShader={/* glsl */ `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
            }
          `}
          fragmentShader={/* glsl */ `
            precision highp float;
            uniform float uTime;
            uniform sampler2D uFreq;
            uniform vec2 uResolution;
            varying vec2 vUv;

            float fluidNoise(vec2 p) {
              return sin(p.x*4.0 + uTime*0.5)*cos(p.y*4.0 - uTime*0.3);
            }

            void main(){
              float f = texture2D(uFreq, vec2(vUv.x,0.)).r;
              float I = f/255.0;
              vec3 base = vec3(0.02,0.05,0.1);
              vec3 peak = vec3(0.1,0.3,0.4);
              vec3 col = mix(base, peak, I);
              col += 0.06*fluidNoise(vUv*vec2(1.0,1.5));
              gl_FragColor = vec4(col,1.0);
            }
          `}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

export default AudioVisualizer
