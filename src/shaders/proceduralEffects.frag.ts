// Procedural Noise & RGB Glitch Shaders

// Enhanced procedural noise fragment shader
export const proceduralNoiseFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uNoiseScale;
uniform float uDistortionAmount;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec2 vUv;

// Multi-octave simplex noise
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

float fbm(vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 0.0;
    
    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vUv;
    vec2 st = uv * uNoiseScale;
    
    // Audio-reactive time scaling
    float timeScale = uTime + uBassLevel * 2.0;
    
    // Multi-layered noise with audio reactivity
    float noise1 = fbm(st + timeScale * 0.1, 4);
    float noise2 = fbm(st * 2.0 + timeScale * 0.2, 3);
    float noise3 = fbm(st * 4.0 + timeScale * 0.3, 2);
    
    // Audio-reactive distortion
    vec2 distortion = vec2(
        noise1 * uDistortionAmount * uMidLevel,
        noise2 * uDistortionAmount * uHighLevel
    );
    
    // Color mixing based on noise layers and audio
    vec3 color = mix(uColorA, uColorB, noise1 + uBassLevel * 0.3);
    color = mix(color, uColorC, noise2 + uMidLevel * 0.2);
    
    // Add procedural patterns
    float pattern = sin(st.x * 10.0 + noise3 * 20.0) * cos(st.y * 8.0 + noise1 * 15.0);
    color += vec3(pattern * 0.1 * uHighLevel);
    
    // Audio-reactive brightness
    float brightness = 1.0 + (uBassLevel + uMidLevel + uHighLevel) * 0.2;
    color *= brightness;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// RGB Glitch/Chromatic Aberration Shader
export const rgbGlitchFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uChromaticAberration;
uniform float uScanlineIntensity;
uniform float uBassLevel;
uniform vec2 uResolution;

varying vec2 vUv;

float random(float n) {
    return fract(sin(n) * 43758.5453123);
}

void main() {
    vec2 uv = vUv;
    
    // Bass-reactive glitch displacement
    float glitchAmount = uGlitchIntensity * (1.0 + uBassLevel * 2.0);
    
    // Horizontal glitch lines
    float glitchLine = step(0.98, random(floor(uv.y * 100.0) + uTime * 10.0));
    uv.x += glitchLine * (random(uTime) - 0.5) * glitchAmount;
    
    // Chromatic aberration with audio reactivity
    float aberration = uChromaticAberration * (1.0 + uBassLevel * 0.5);
    
    float r = texture2D(uTexture, uv + vec2(aberration * 0.01, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv - vec2(aberration * 0.01, 0.0)).b;
    
    vec3 color = vec3(r, g, b);
    
    // Scanlines
    float scanline = sin(uv.y * uResolution.y * 0.7) * 0.5 + 0.5;
    color *= 1.0 - uScanlineIntensity * (1.0 - scanline);
    
    // Digital noise
    float noise = random(uv.x + uv.y * 1000.0 + uTime * 100.0);
    color += vec3(noise * 0.05 * glitchAmount);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

// Water Ripple Shader  
export const waterRippleFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uRippleSpeed;
uniform float uRippleStrength;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5) + (uMouse - 0.5) * 0.3;
    
    float dist = length(uv - center);
    
    // Audio-reactive ripples
    float ripple1 = sin(dist * 40.0 - uTime * uRippleSpeed) * 
                   exp(-dist * 8.0) * uRippleStrength * uBassLevel;
    
    float ripple2 = sin(dist * 60.0 - uTime * uRippleSpeed * 1.5) * 
                   exp(-dist * 12.0) * uRippleStrength * 0.5 * uMidLevel;
    
    // Distort UV based on ripples
    vec2 distortedUV = uv + vec2(ripple1 + ripple2) * 0.02;
    
    // Water color with depth
    vec3 deepWater = vec3(0.0, 0.2, 0.4);
    vec3 shallowWater = vec3(0.3, 0.7, 1.0);
    
    float depth = 1.0 - dist;
    vec3 waterColor = mix(deepWater, shallowWater, depth);
    
    // Add surface reflections
    float reflection = pow(1.0 - dist, 2.0) * 0.3;
    waterColor += vec3(reflection);
    
    // Audio-reactive foam/bubbles
    float foam = step(0.95, sin(distortedUV.x * 100.0) * cos(distortedUV.y * 100.0) + uBassLevel);
    waterColor += vec3(foam * 0.5);
    
    gl_FragColor = vec4(waterColor, 1.0);
}
`;

// Voronoi Pattern Shader
export const voronoiFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform float uCellCount;
uniform vec3 uColorPalette[5];

varying vec2 vUv;

vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)), dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

void main() {
    vec2 uv = vUv * uCellCount;
    vec2 i_st = floor(uv);
    vec2 f_st = fract(uv);
    
    float minDist = 1.0;
    vec2 minPoint;
    
    // Find closest Voronoi cell
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i_st + neighbor);
            
            // Audio-reactive point movement
            point = 0.5 + 0.5 * sin(uTime * 0.5 + 6.2831 * point + uBassLevel * 2.0);
            
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            if (dist < minDist) {
                minDist = dist;
                minPoint = point;
            }
        }
    }
    
    // Color based on distance and audio
    int colorIndex = int(mod(minDist * 10.0 + uTime, 5.0));
    vec3 color = uColorPalette[colorIndex];
    
    // Audio-reactive brightness and pattern
    color *= 1.0 + uMidLevel * 0.5;
    
    // Edge highlighting
    float edge = step(minDist, 0.1) * uHighLevel;
    color += vec3(edge);
    
    gl_FragColor = vec4(color, 1.0);
}
`;