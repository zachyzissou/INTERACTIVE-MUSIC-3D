'use client'
// src/components/AudioVisualizer.tsx
import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { getAnalyser, getFrequencyDataArray, getFrequencyTexture, getAnalyserBands } from '../lib/analyser'

const AudioVisualizer: React.FC = () => {
  const { viewport } = useThree()
  const width = viewport.width
  const height = viewport.height
  const textureRef = useRef<THREE.DataTexture | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)

  useEffect(() => {
    getAnalyser()
    textureRef.current = getFrequencyTexture()
  }, [])

  useFrame(({ clock }) => {
    const texture = textureRef.current
    if (texture && materialRef.current) {
      getAnalyserBands()
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uFreqTex.value = texture
    }
  })

  return (
    <>
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
      <mesh raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={{
            uTime: { value: 0 },
            uFreqTex: { value: null },
            uResolution: { value: new THREE.Vector2(width, height) },
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
            uniform sampler2D uFreqTex;
            varying vec2 vUv;

            vec3 hsl2rgb(vec3 c){
              vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
              return c.z + c.y*(rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
            }
            float band(float s,float e){
              float sum=0.0;
              for(int i=0;i<8;i++){
                float fi=mix(s,e,float(i)/7.0)/256.0;
                sum+=texture2D(uFreqTex,vec2(fi,0.0)).r;
              }
              return sum/8.0;
            }
            void main(){
              float low=band(0.0,85.0)/255.0;
              float mid=band(85.0,170.0)/255.0;
              float high=band(170.0,255.0)/255.0;
              float amp=(low+mid+high)/3.0;
              vec2 uv=vUv+vec2(sin(uTime+vUv.y*4.0),cos(uTime+vUv.x*4.0))*amp*0.1;
              vec3 col=hsl2rgb(vec3(0.5,1.0,low));
              col+=hsl2rgb(vec3(0.666,1.0,mid));
              col+=hsl2rgb(vec3(0.833,1.0,high));
              gl_FragColor=vec4(col,0.5);
            }
          `}
          depthTest={false}
          depthWrite={false}
          transparent
        />
      </mesh>
    </>
  )
}

export default AudioVisualizer
