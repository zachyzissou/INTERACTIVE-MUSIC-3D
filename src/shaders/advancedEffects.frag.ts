// Advanced GLSL Voronoi pattern shader
export const voronoiFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uCellCount;
uniform float uAnimationSpeed;
uniform float uEdgeWidth;
uniform float uColorVariation;
uniform float uBrightness;

varying vec2 vUv;

vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)),
              dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

// Improved noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(dot(random2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(random2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(random2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(random2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 uv = vUv * uCellCount;
    vec2 iuv = floor(uv);
    vec2 fuv = fract(uv);
    
    float minDist = 1.0;
    vec2 closestPoint;
    
    // Check 9 neighboring cells
    for(int y = -1; y <= 1; y++) {
        for(int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(iuv + neighbor);
            
            // Animate points based on audio
            point = 0.5 + 0.5 * sin(uTime * uAnimationSpeed + point * 6.28 + uBassLevel * 3.14);
            
            vec2 diff = neighbor + point - fuv;
            float dist = length(diff);
            
            if(dist < minDist) {
                minDist = dist;
                closestPoint = point;
            }
        }
    }
    
    // Create edge effect
    float edge = smoothstep(0.0, uEdgeWidth, minDist);
    
    // Color based on cell position and audio
    vec3 cellColor = vec3(
        0.5 + 0.5 * sin(closestPoint.x * 6.28 + uTime + uBassLevel * 2.0),
        0.5 + 0.5 * sin(closestPoint.y * 6.28 + uTime + uMidLevel * 2.0),
        0.5 + 0.5 * sin((closestPoint.x + closestPoint.y) * 3.14 + uTime + uHighLevel * 2.0)
    );
    
    // Apply color variation
    cellColor = mix(cellColor, vec3(0.8, 0.2, 1.0), uColorVariation * uBassLevel);
    
    // Edge glow effect
    vec3 edgeColor = vec3(1.0, 0.3, 0.8) * (1.0 - edge) * 2.0;
    
    vec3 finalColor = mix(edgeColor, cellColor * edge, edge);
    finalColor *= uBrightness * (1.0 + uMidLevel * 0.5);
    
    // Add subtle noise texture
    float noiseValue = noise(vUv * 50.0 + uTime * 2.0) * 0.1;
    finalColor += vec3(noiseValue);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// RGB Glitch shader with scanlines and chromatic aberration
export const rgbGlitchFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uGlitchIntensity;
uniform float uColorSeparation;
uniform float uScanlineFreq;
uniform float uNoiseAmount;
uniform float uFlickerSpeed;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(random(i), random(i + vec2(1.0, 0.0)), u.x),
               mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 uv = vUv;
    
    // Time-based flicker
    float flicker = sin(uTime * uFlickerSpeed) * 0.5 + 0.5;
    float glitchAmount = uGlitchIntensity * (uBassLevel + flicker * 0.3);
    
    // Horizontal distortion
    float distortion = sin(uv.y * 10.0 + uTime * 5.0) * glitchAmount * 0.02;
    uv.x += distortion;
    
    // Chromatic aberration
    float aberration = uColorSeparation * glitchAmount;
    float r = texture2D(u_texture, uv + vec2(aberration, 0.0)).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - vec2(aberration, 0.0)).b;
    
    // Fallback colors when no texture
    if(aberration > 0.0) {
        r = 0.8 + 0.2 * sin(uv.x * 20.0 + uTime * 3.0);
        g = 0.2 + 0.3 * sin(uv.y * 15.0 + uTime * 2.0);
        b = 0.6 + 0.4 * sin((uv.x + uv.y) * 10.0 + uTime * 4.0);
    } else {
        r = g = b = 0.5 + 0.5 * sin(length(uv - 0.5) * 10.0 - uTime * 2.0);
    }
    
    vec3 color = vec3(r, g, b);
    
    // Scanlines
    float scanline = sin(uv.y * uScanlineFreq) * 0.5 + 0.5;
    scanline = pow(scanline, 2.0);
    color *= 0.8 + scanline * 0.4;
    
    // Digital noise
    float digitalNoise = random(uv + uTime * 100.0);
    color += vec3(digitalNoise * uNoiseAmount * glitchAmount);
    
    // Audio reactive glow
    float glow = 1.0 + uMidLevel * 0.5 + uHighLevel * 0.3;
    color *= glow;
    
    // Random glitch blocks
    vec2 blockUV = floor(uv * vec2(64.0, 36.0)) / vec2(64.0, 36.0);
    float blockNoise = random(blockUV + floor(uTime * 8.0));
    
    if(blockNoise > 0.95 && glitchAmount > 0.3) {
        color = vec3(1.0, 0.0, 1.0); // Magenta glitch blocks
    }
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Plasma shader
export const plasmaFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uFrequency1;
uniform float uFrequency2;
uniform float uPhase1;
uniform float uPhase2;
uniform float uColorShift;
uniform float uIntensity;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    
    // Plasma calculation with audio reactivity
    float time = uTime + uBassLevel * 2.0;
    
    float plasma = sin(uv.x * uFrequency1 + time + uPhase1);
    plasma += sin(uv.y * uFrequency2 + time + uPhase2);
    plasma += sin((uv.x + uv.y) * 2.0 + time + uMidLevel * 3.14);
    plasma += sin(sqrt(uv.x * uv.x + uv.y * uv.y) * 3.0 + time + uHighLevel * 3.14);
    
    plasma *= 0.25; // Normalize
    
    // Color mapping with audio reactive shift
    float colorTime = time * 0.5 + uColorShift;
    vec3 color;
    color.r = sin(plasma * 3.14159 + colorTime) * 0.5 + 0.5;
    color.g = sin(plasma * 3.14159 + colorTime + 2.094) * 0.5 + 0.5;
    color.b = sin(plasma * 3.14159 + colorTime + 4.188) * 0.5 + 0.5;
    
    // Apply intensity and audio reactivity
    color *= uIntensity * (1.0 + uMidLevel * 0.5);
    
    // Add some sparkle based on high frequencies
    float sparkle = pow(max(0.0, sin(plasma * 10.0 + time * 5.0)), 8.0);
    color += vec3(sparkle * uHighLevel * 0.5);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Define the shader exports
const advancedShaders = {
  voronoiFragmentShader,
  rgbGlitchFragmentShader,
  plasmaFragmentShader
};

export default advancedShaders;