'use client'
import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getAnalyserBands } from '../lib/analyser'
import { useArtisticTheme } from '../store/useArtisticTheme'

interface FluidBlobGeometryProps {
  complexity?: number
  viscosity?: number
  wobbliness?: number
  blobIntensity?: number
  size?: number
}

// Metaball geometry generator
class MetaballGeometry extends THREE.BufferGeometry {
  private resolution: number
  private size: number
  
  constructor(resolution = 32, size = 2) {
    super()
    this.resolution = resolution
    this.size = size
    this.generateGeometry()
  }

  private generateGeometry() {
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Create icosphere base for organic deformation
    const geometry = new THREE.IcosahedronGeometry(this.size, 3)
    const positionAttribute = geometry.getAttribute('position')
    const normalAttribute = geometry.getAttribute('normal')
    const uvAttribute = geometry.getAttribute('uv')

    // Copy attributes
    for (let i = 0; i < positionAttribute.count; i++) {
      positions.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i), 
        positionAttribute.getZ(i)
      )
      normals.push(
        normalAttribute.getX(i),
        normalAttribute.getY(i),
        normalAttribute.getZ(i)
      )
      uvs.push(
        uvAttribute.getX(i),
        uvAttribute.getY(i)
      )
    }

    // Copy indices
    const index = geometry.getIndex()
    if (index) {
      for (let i = 0; i < index.count; i++) {
        indices.push(index.getX(i))
      }
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    this.setIndex(indices)
  }
}

// Cymatic surface geometry with frequency-based patterns
class CymaticGeometry extends THREE.BufferGeometry {
  private resolution: number
  private size: number
  
  constructor(resolution = 64, size = 2) {
    super()
    this.resolution = resolution
    this.size = size
    this.generateGeometry()
  }

  private generateGeometry() {
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Generate grid vertices
    for (let i = 0; i <= this.resolution; i++) {
      for (let j = 0; j <= this.resolution; j++) {
        const u = i / this.resolution
        const v = j / this.resolution
        
        // Convert to radial coordinates for cymatic patterns
        const phi = u * Math.PI * 2
        const theta = v * Math.PI
        
        // Spherical to cartesian with displacement
        const radius = this.size * (0.8 + Math.sin(phi * 6) * Math.cos(theta * 4) * 0.2)
        const x = radius * Math.sin(theta) * Math.cos(phi)
        const y = radius * Math.cos(theta)
        const z = radius * Math.sin(theta) * Math.sin(phi)
        
        positions.push(x, y, z)
        
        // Calculate normal (will be refined in shader)
        const normal = new THREE.Vector3(x, y, z).normalize()
        normals.push(normal.x, normal.y, normal.z)
        
        uvs.push(u, v)
      }
    }

    // Generate indices for triangles
    for (let i = 0; i < this.resolution; i++) {
      for (let j = 0; j < this.resolution; j++) {
        const a = i * (this.resolution + 1) + j
        const b = a + this.resolution + 1
        const c = a + 1
        const d = b + 1

        indices.push(a, b, c)
        indices.push(c, b, d)
      }
    }

    this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    this.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    this.setIndex(indices)
  }
}

export default function FluidBlobGeometry({
  complexity = 3,
  viscosity,
  wobbliness,
  blobIntensity,
  size = 1.0
}: FluidBlobGeometryProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { getCurrentConfig } = useArtisticTheme()
  const themeConfig = getCurrentConfig()
  
  // Use theme values as defaults if props not provided
  const finalViscosity = viscosity ?? themeConfig.shaderParams.viscosity
  const finalWobbliness = wobbliness ?? themeConfig.shaderParams.wobbliness
  const finalBlobIntensity = blobIntensity ?? (themeConfig.shaderParams.glowIntensity * 0.5)
  
  // Create fluid blob shader material
  const fluidMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        bassLevel: { value: 0 },
        midLevel: { value: 0 },  
        trebleLevel: { value: 0 },
        viscosity: { value: finalViscosity },
        wobbliness: { value: finalWobbliness },
        blobIntensity: { value: finalBlobIntensity },
        modelMatrix: { value: new THREE.Matrix4() },
        viewMatrix: { value: new THREE.Matrix4() },
        projectionMatrix: { value: new THREE.Matrix4() },
        normalMatrix: { value: new THREE.Matrix3() }
      },
      vertexShader: `
        uniform float time;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        uniform float viscosity;
        uniform float wobbliness;
        uniform float blobIntensity;
        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform mat3 normalMatrix;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vAudioReactive;
        
        // Simplex noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        float metaballField(vec3 pos) {
          vec3 center1 = vec3(sin(time * 0.5) * 0.3, cos(time * 0.7) * 0.2, 0.0);
          vec3 center2 = vec3(-sin(time * 0.3) * 0.2, -cos(time * 0.6) * 0.3, sin(time * 0.4) * 0.1);
          vec3 center3 = vec3(cos(time * 0.4) * 0.15, sin(time * 0.8) * 0.15, -cos(time * 0.5) * 0.2);
          
          float r1 = 0.4 + bassLevel * 0.3;
          float r2 = 0.35 + midLevel * 0.25;
          float r3 = 0.3 + trebleLevel * 0.2;
          
          float d1 = length(pos - center1);
          float d2 = length(pos - center2);
          float d3 = length(pos - center3);
          
          return r1*r1 / (d1*d1 + 0.01) + r2*r2 / (d2*d2 + 0.01) + r3*r3 / (d3*d3 + 0.01);
        }
        
        float cymaticPattern(vec3 pos, float frequency) {
          float radialDist = length(pos.xz);
          float angle = atan(pos.z, pos.x);
          
          float radialWave = sin(radialDist * frequency * 8.0 - time * 2.0) * 0.5 + 0.5;
          float angularWave = sin(angle * 6.0 + time * 1.5) * 0.5 + 0.5;
          
          return radialWave * angularWave;
        }
        
        void main() {
          vec3 pos = position;
          
          // Audio-reactive displacement
          float audioSum = bassLevel + midLevel + trebleLevel;
          float audioFactor = audioSum * blobIntensity;
          
          // Multi-octave noise for organic shape
          float noiseScale1 = 2.0 + viscosity;
          float noiseScale2 = 4.0 + wobbliness;
          float noiseScale3 = 8.0;
          
          vec3 noisePos = pos + vec3(time * 0.1);
          float n1 = snoise(noisePos * noiseScale1) * 0.4;
          float n2 = snoise(noisePos * noiseScale2) * 0.2;
          float n3 = snoise(noisePos * noiseScale3) * 0.1;
          
          float combinedNoise = n1 + n2 + n3;
          
          // Metaball influence
          float metaballInfluence = metaballField(pos) * 0.15;
          
          // Cymatic patterns
          float bassPattern = cymaticPattern(pos, bassLevel * 0.5 + 1.0) * bassLevel * 0.1;
          float midPattern = cymaticPattern(pos, midLevel * 0.7 + 1.5) * midLevel * 0.08;
          float treblePattern = cymaticPattern(pos, trebleLevel * 1.0 + 2.0) * trebleLevel * 0.06;
          
          // Combine all displacement effects
          float totalDisplacement = (combinedNoise + metaballInfluence + bassPattern + midPattern + treblePattern) * audioFactor;
          
          // Apply displacement along normal
          pos += normal * totalDisplacement * 0.8;
          
          // Additional radial displacement
          float radialDisplacement = (audioSum * 0.1 + sin(time * 1.5) * 0.05) * blobIntensity;
          pos += normalize(pos) * radialDisplacement;
          
          // Transform to world space
          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPosition = worldPos.xyz;
          
          // Transform normal
          vNormal = normalMatrix * normal;
          
          // Final position
          gl_Position = projectionMatrix * viewMatrix * worldPos;
          vUv = uv;
          vAudioReactive = audioFactor;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float bassLevel;
        uniform float midLevel;
        uniform float trebleLevel;
        
        varying vec3 vWorldPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vAudioReactive;
        
        void main() {
          vec3 normal = normalize(vNormal);
          
          // Audio-reactive color shifts using theme colors
          vec3 bassColor = vec3(${new THREE.Color(themeConfig.colors.primary).r}, ${new THREE.Color(themeConfig.colors.primary).g}, ${new THREE.Color(themeConfig.colors.primary).b}) * bassLevel;
          vec3 midColor = vec3(${new THREE.Color(themeConfig.colors.secondary).r}, ${new THREE.Color(themeConfig.colors.secondary).g}, ${new THREE.Color(themeConfig.colors.secondary).b}) * midLevel;
          vec3 trebleColor = vec3(${new THREE.Color(themeConfig.colors.accent).r}, ${new THREE.Color(themeConfig.colors.accent).g}, ${new THREE.Color(themeConfig.colors.accent).b}) * trebleLevel;
          
          vec3 baseColor = vec3(${new THREE.Color(themeConfig.colors.secondary).r}, ${new THREE.Color(themeConfig.colors.secondary).g}, ${new THREE.Color(themeConfig.colors.secondary).b});
          vec3 audioColor = (bassColor + midColor + trebleColor) * 0.5;
          vec3 finalColor = mix(baseColor, audioColor, vAudioReactive);
          
          // Fresnel effect
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
          
          // Iridescent shift
          float iridescence = sin(fresnel * 10.0 + time * 2.0 + vAudioReactive * 5.0) * 0.1 + 0.9;
          
          gl_FragColor = vec4(finalColor * iridescence, 0.85 + fresnel * 0.15);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending
    })
  }, [finalViscosity, finalWobbliness, finalBlobIntensity, themeConfig.colors])

  // Create geometry based on complexity
  const geometry = useMemo(() => {
    if (complexity <= 2) {
      return new MetaballGeometry(16, size)
    } else {
      return new CymaticGeometry(32, size)
    }
  }, [complexity, size])

  // Update uniforms on each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
      
      // Get audio data
      try {
        const { bass, mid, treble } = getAnalyserBands()
        materialRef.current.uniforms.bassLevel.value = bass / 255
        materialRef.current.uniforms.midLevel.value = mid / 255
        materialRef.current.uniforms.trebleLevel.value = treble / 255
      } catch (error) {
        // Fallback values
        materialRef.current.uniforms.bassLevel.value = 0.1
        materialRef.current.uniforms.midLevel.value = 0.1
        materialRef.current.uniforms.trebleLevel.value = 0.1
      }
      
      // Update matrices
      if (meshRef.current) {
        materialRef.current.uniforms.modelMatrix.value = meshRef.current.matrixWorld
        materialRef.current.uniforms.viewMatrix.value = state.camera.matrixWorldInverse
        materialRef.current.uniforms.projectionMatrix.value = state.camera.projectionMatrix
        materialRef.current.uniforms.normalMatrix.value.getNormalMatrix(meshRef.current.matrixWorld)
      }
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <primitive ref={materialRef} object={fluidMaterial} attach="material" />
    </mesh>
  )
}