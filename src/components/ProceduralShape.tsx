'use client'
import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { ObjectType, objectConfigs } from '../config/objectTypes'
import { getAnalyser, getFrequencyBands } from '../lib/analyser'
import { PLANE_SIZE } from '../config/constants'

interface ProceduralShapeProps {
  type: ObjectType
}

const ProceduralShape: React.FC<ProceduralShapeProps> = ({ type }) => {
  const mat = useRef<THREE.ShaderMaterial>(null!)

  useEffect(() => {
    getAnalyser()
  }, [])

  useFrame(({ clock }) => {
    if (!mat.current) return
    const { low, mid, high } = getFrequencyBands()
    mat.current.uniforms.uBass.value = low
    mat.current.uniforms.uMid.value = mid
    mat.current.uniforms.uHigh.value = high
    mat.current.uniforms.uAudio.value = (low + mid + high) / 3
    mat.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  const color = new THREE.Color(objectConfigs[type].color)
  const shapeType = type === 'note' ? 0 : type === 'chord' ? 1 : type === 'beat' ? 2 : 3

  return (
    <Billboard>
      <mesh>
        <planeGeometry args={[PLANE_SIZE, PLANE_SIZE]} />
        <shaderMaterial
          ref={mat}
          transparent
          uniforms={{
            uTime: { value: 0 },
            uBass: { value: 0 },
            uMid: { value: 0 },
            uHigh: { value: 0 },
            uAudio: { value: 0 },
            uColor: { value: color },
            uType: { value: shapeType },
          }}
          vertexShader={`
            varying vec2 vUv;
            uniform float uAudio;
            void main(){
              vUv = uv;
              vec3 pos = position + normal * uAudio * 0.1;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
            }
          `}
          fragmentShader={`
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            uniform float uBass;
            uniform float uMid;
            uniform float uHigh;
            uniform float uAudio;
            uniform vec3 uColor;
            uniform int uType;

            float sdSphere(vec3 p,float r){return length(p)-r;}
            float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}
            float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xz)-t.x,p.y);return length(q)-t.y;}
            float map(vec3 p){
              if(uType==0) return sdSphere(p,0.5);
              if(uType==1) return sdTorus(p,vec2(0.5,0.2));
              if(uType==2) return sdBox(p,vec3(0.5));
              float a=atan(p.z,p.x);
              float r=length(p.xz)-0.3;
              vec3 q=vec3(r, p.y, sin(a*3.0)*0.2);
              return sdTorus(q, vec2(0.3,0.1));
            }
            vec3 getNormal(vec3 p){
              vec2 e=vec2(0.001,0.0);
              return normalize(vec3(
                map(p+e.xyy)-map(p-e.xyy),
                map(p+e.yxy)-map(p-e.yxy),
                map(p+e.yyx)-map(p-e.yyx)
              ));
            }
            #define MAX_STEPS 64
            #define MAX_DIST 2.0
            #define SURF_DIST 0.001
            float raymarch(vec3 ro, vec3 rd){
              float d=0.0;
              for(int i=0;i<MAX_STEPS;i++){
                vec3 p=ro+rd*d;
                float dist = map(p);
                if(dist<SURF_DIST||d>MAX_DIST) break;
                d += dist;
              }
              return d;
            }
            void main(){
              vec2 uv = vUv*2.0-1.0;
              vec3 ro = vec3(0.0,0.0,2.0);
              vec3 rd = normalize(vec3(uv,-1.5));
              float d = raymarch(ro, rd);
              if(d>MAX_DIST) discard;
              vec3 pos = ro + rd*d;
              vec3 normal = getNormal(pos);
              vec3 lightDir = normalize(vec3(0.3,0.6,0.8));
              float diff = clamp(dot(normal, lightDir),0.0,1.0);
              vec3 col = uColor*(0.4+0.6*diff + uAudio*0.3);
              col += vec3(uBass,uMid,uHigh)*0.4;
              gl_FragColor = vec4(col,1.0);
            }
          `}
        />
      </mesh>
    </Billboard>
  )
}

export default ProceduralShape
