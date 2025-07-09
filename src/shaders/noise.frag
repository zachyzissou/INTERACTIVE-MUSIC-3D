// Advanced Procedural Noise Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioData[32];
uniform vec2 uMouse;
varying vec2 vUv;

// Simplex noise implementation
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626, // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0

    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Fractal noise
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * snoise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Turbulence
float turbulence(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * abs(snoise(st));
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 st = vUv * 4.0;
    
    // Audio reactivity
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Time modulation with audio
    float audioTime = uTime + bassEnergy * 2.0;
    
    // Mouse interaction
    vec2 mouseInfluence = (uMouse - 0.5) * 2.0;
    st += mouseInfluence * 0.5;
    
    // Multiple noise layers
    float noise1 = fbm(st + audioTime * 0.1);
    float noise2 = turbulence(st * 1.5 + audioTime * 0.15);
    float noise3 = snoise(st * 3.0 + audioTime * 0.2);
    
    // Combine noises with audio modulation
    float combinedNoise = noise1 + noise2 * midEnergy + noise3 * highEnergy;
    
    // Domain warping
    vec2 warpedSt = st + vec2(
        fbm(st + vec2(audioTime * 0.1, 0.0)),
        fbm(st + vec2(0.0, audioTime * 0.1))
    ) * bassEnergy;
    
    float warpedNoise = fbm(warpedSt);
    
    // Color mapping
    vec3 color1 = vec3(0.1, 0.2, 0.9); // Deep blue
    vec3 color2 = vec3(0.9, 0.1, 0.7); // Magenta
    vec3 color3 = vec3(0.1, 0.9, 0.9); // Cyan
    vec3 color4 = vec3(0.9, 0.9, 0.1); // Yellow
    
    // Multi-step color interpolation
    vec3 finalColor = mix(color1, color2, smoothstep(-0.5, 0.5, noise1));
    finalColor = mix(finalColor, color3, smoothstep(-0.3, 0.7, noise2 * midEnergy));
    finalColor = mix(finalColor, color4, smoothstep(0.0, 1.0, warpedNoise * bassEnergy));
    
    // Add energy-based brightness
    finalColor *= 0.8 + 0.4 * (bassEnergy + midEnergy + highEnergy) / 3.0;
    
    // Edge enhancement
    vec2 derivative = vec2(
        fbm(st + vec2(0.01, 0.0)) - fbm(st - vec2(0.01, 0.0)),
        fbm(st + vec2(0.0, 0.01)) - fbm(st - vec2(0.0, 0.01))
    );
    
    float edgeStrength = length(derivative) * 20.0;
    finalColor += vec3(edgeStrength) * highEnergy * 0.3;
    
    // Neon glow effect
    float glow = exp(-length(vUv - 0.5) * 3.0) * bassEnergy;
    finalColor += glow * vec3(0.5, 0.8, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}