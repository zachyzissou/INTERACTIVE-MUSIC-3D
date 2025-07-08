// Neon Noise Fragment Shader - GLSL Version
#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioData[32];
uniform float uNoiseScale;
uniform float uGlowIntensity;

in vec2 vUv;
out vec4 fragColor;

// Simplex noise implementation
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
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

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

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

// Fractal Brownian Motion
float fbm(vec3 p) {
    float value = 0.0;
    float frequency = 1.0;
    float amplitude = 0.5;
    
    for(int i = 0; i < 6; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    vec2 st = (gl_FragCoord.xy / uResolution.xy);
    
    // Audio reactivity
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Time with audio modulation
    float time = uTime + bassEnergy * 2.0;
    
    // Multi-octave noise with audio scaling
    vec3 noisePos = vec3(st * uNoiseScale, time * 0.1);
    noisePos.xy += vec2(sin(time * 0.1), cos(time * 0.15)) * midEnergy;
    
    float noise1 = fbm(noisePos);
    float noise2 = fbm(noisePos * 2.0 + vec3(100.0, 100.0, 0.0));
    float noise3 = fbm(noisePos * 4.0 + vec3(200.0, 200.0, 0.0));
    
    // Combine noise layers
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    combinedNoise = (combinedNoise + 1.0) * 0.5; // Normalize to 0-1
    
    // Audio-reactive threshold
    float threshold = 0.3 + bassEnergy * 0.4;
    float neonMask = smoothstep(threshold - 0.1, threshold + 0.1, combinedNoise);
    
    // Neon color palette
    vec3 neonPink = vec3(1.0, 0.1, 0.5);
    vec3 neonCyan = vec3(0.1, 0.8, 1.0);
    vec3 neonGreen = vec3(0.1, 1.0, 0.3);
    vec3 neonPurple = vec3(0.8, 0.1, 1.0);
    
    // Color mixing based on noise and audio
    vec3 color1 = mix(neonPink, neonCyan, sin(time + noise1 * 3.0) * 0.5 + 0.5);
    vec3 color2 = mix(neonGreen, neonPurple, cos(time + noise2 * 2.0) * 0.5 + 0.5);
    
    vec3 finalColor = mix(color1, color2, highEnergy);
    
    // Add glow effect
    float glow = exp(-length(st - 0.5) * (2.0 - midEnergy)) * uGlowIntensity;
    finalColor += glow * vec3(1.0, 1.0, 1.0) * bassEnergy;
    
    // Edge detection for extra neon effect
    float edgeNoise = fbm(noisePos * 8.0);
    float edge = abs(edgeNoise - 0.5) * 2.0;
    edge = smoothstep(0.8, 1.0, edge);
    finalColor += edge * vec3(1.0, 1.0, 1.0) * highEnergy;
    
    // Final intensity modulation
    finalColor *= (0.8 + combinedNoise * 0.4);
    
    fragColor = vec4(finalColor, neonMask * (0.7 + bassEnergy * 0.3));
}