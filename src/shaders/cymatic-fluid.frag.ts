// Cymatic Fluid Shader - Inspired by "3D Cymatic Music Visualizer" and webgl_shaders_ocean
export const cymaticFluidShader = {
  uniforms: {
    time: { value: 0.0 },
    resolution: { value: [1920, 1080] },
    mouse: { value: [0.0, 0.0] },
    audioData: { value: new Float32Array(256) },
    bassLevel: { value: 0.0 },
    midLevel: { value: 0.0 },
    trebleLevel: { value: 0.0 },
    audioAmplitude: { value: 0.0 },
    colorPrimary: { value: [0.0, 1.0, 1.0] },
    colorSecondary: { value: [1.0, 0.0, 1.0] },
    fluidIntensity: { value: 1.0 },
    cymaticFreq: { value: 440.0 },
    distortionAmount: { value: 0.5 }
  },
  
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    uniform float time;
    uniform float bassLevel;
    uniform float audioAmplitude;
    uniform float[256] audioData;
    
    // Simplex noise function
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
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Audio-reactive vertex displacement using cymatic patterns
      vec3 pos = position;
      
      // Create cymatic frequency patterns
      float freq1 = sin(pos.x * 8.0 + time * 2.0) * cos(pos.z * 8.0 + time * 1.5);
      float freq2 = sin(pos.x * 16.0 - time) * sin(pos.z * 12.0 + time * 0.8);
      float freq3 = cos(pos.x * 4.0 + pos.z * 4.0 + time * 3.0);
      
      // Combine with audio data for reactive displacement
      float audioIndex = clamp(floor(uv.x * 256.0), 0.0, 255.0);
      float audioValue = audioData[int(audioIndex)] / 255.0;
      
      // Multi-layered displacement
      float displacement = (freq1 + freq2 * 0.5 + freq3 * 0.3) * audioValue;
      displacement += snoise(pos * 2.0 + time * 0.5) * bassLevel * 0.3;
      displacement += audioAmplitude * 0.5;
      
      // Apply displacement along normal
      pos += normal * displacement * 0.2;
      
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float[256] audioData;
    uniform float bassLevel;
    uniform float midLevel;
    uniform float trebleLevel;
    uniform float audioAmplitude;
    uniform vec3 colorPrimary;
    uniform vec3 colorSecondary;
    uniform float fluidIntensity;
    uniform float cymaticFreq;
    uniform float distortionAmount;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    // Noise functions for fluid effects
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Fluid distortion inspired by ocean shader
    vec2 fluidDistortion(vec2 uv, float time, float intensity) {
      vec2 distortion = vec2(0.0);
      
      // Large wave patterns
      distortion.x += sin(uv.y * 4.0 + time * 1.5) * intensity * 0.02;
      distortion.y += cos(uv.x * 3.0 + time * 2.0) * intensity * 0.02;
      
      // Medium frequency ripples
      distortion.x += sin(uv.y * 12.0 - time * 3.0) * intensity * 0.01;
      distortion.y += sin(uv.x * 8.0 + time * 2.5) * intensity * 0.01;
      
      // High frequency detail
      distortion += vec2(
        noise(uv * 20.0 + time * 0.5),
        noise(uv * 15.0 - time * 0.3)
      ) * intensity * 0.005;
      
      return distortion;
    }
    
    // Cymatic pattern generation
    float cymaticPattern(vec2 uv, float freq, float amplitude) {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(uv, center);
      
      // Standing wave patterns
      float pattern = sin(dist * freq) * cos(dist * freq * 0.7);
      pattern += sin(uv.x * freq * 2.0) * sin(uv.y * freq * 1.5) * 0.5;
      pattern += cos((uv.x - uv.y) * freq * 1.8) * 0.3;
      
      return pattern * amplitude;
    }
    
    void main() {
      vec2 uv = vUv;
      
      // Apply fluid distortion based on audio
      vec2 fluidUv = uv + fluidDistortion(uv, time, fluidIntensity * (bassLevel + midLevel));
      
      // Generate cymatic patterns
      float cymatic = cymaticPattern(fluidUv, cymaticFreq * (1.0 + trebleLevel), audioAmplitude);
      
      // Audio-reactive color mixing
      vec3 baseColor = mix(colorPrimary, colorSecondary, sin(time * 0.5) * 0.5 + 0.5);
      
      // Frequency-based coloring
      float audioIndex = clamp(floor(uv.x * 256.0), 0.0, 255.0);
      float audioValue = audioData[int(audioIndex)] / 255.0;
      
      vec3 audioColor = vec3(
        bassLevel + audioValue * 0.5,
        midLevel + cymatic * 0.3,
        trebleLevel + sin(cymatic * 10.0) * 0.2 + 0.5
      );
      
      // Combine colors with fresnel effect
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
      
      vec3 finalColor = mix(baseColor * audioColor, vec3(1.0), fresnel * 0.3);
      
      // Add cymatic highlights
      finalColor += vec3(abs(cymatic)) * audioAmplitude * 2.0;
      
      // Iridescent effect for high frequencies
      finalColor += vec3(
        sin(cymatic * 20.0 + time * 5.0),
        sin(cymatic * 25.0 + time * 6.0),
        sin(cymatic * 30.0 + time * 7.0)
      ) * trebleLevel * 0.3;
      
      // Edge enhancement
      float edge = 1.0 - smoothstep(0.0, 0.1, abs(cymatic));
      finalColor += edge * audioAmplitude * vec3(1.0, 0.8, 0.6);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};