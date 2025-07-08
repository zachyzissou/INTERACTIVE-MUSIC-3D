// Water Ripple & Voronoi Pattern Shaders - WGSL/GLSL Compatible

// Water Ripple GLSL Version
export const waterRippleFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uRippleSpeed;
uniform float uRippleStrength;
uniform vec3 uBaseColor;
uniform vec3 uRippleColor;

varying vec2 vUv;

// Circular ripples
float circularRipple(vec2 uv, vec2 center, float time, float frequency, float amplitude) {
    float dist = length(uv - center);
    float ripple = sin(dist * frequency - time) * amplitude / dist;
    return ripple;
}

// Multiple ripples with audio reactivity
float multipleRipples(vec2 uv, float time, float audioLevel) {
    float ripples = 0.0;
    
    // Bass-driven ripple at center
    ripples += circularRipple(
        uv, 
        vec2(0.5, 0.5), 
        time * uRippleSpeed, 
        20.0 + uBassLevel * 10.0, 
        0.03 + uBassLevel * 0.03
    );
    
    // Mid-frequency ripples
    for (int i = 0; i < 3; i++) {
        float angle = float(i) * 2.0 * 3.14159 / 3.0;
        vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.25;
        ripples += circularRipple(
            uv, 
            center, 
            time * uRippleSpeed * 0.7, 
            15.0 + uMidLevel * 8.0, 
            0.02 + uMidLevel * 0.02
        );
    }
    
    // High-frequency micro ripples
    for (int i = 0; i < 6; i++) {
        float angle = float(i) * 2.0 * 3.14159 / 6.0 + time * 0.2;
        vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.35;
        ripples += circularRipple(
            uv, 
            center, 
            time * uRippleSpeed * 1.3, 
            30.0 + uHighLevel * 15.0, 
            0.01 + uHighLevel * 0.01
        );
    }
    
    // Mouse-driven ripple
    if (uMouse.x > 0.0 && uMouse.y > 0.0) {
        ripples += circularRipple(
            uv, 
            uMouse, 
            time * uRippleSpeed * 0.5, 
            25.0, 
            0.04 * uRippleStrength
        );
    }
    
    return ripples;
}

void main() {
    vec2 uv = vUv;
    float time = uTime;
    
    // Generate ripple displacement
    float rippleDisplacement = multipleRipples(uv, time, uBassLevel);
    
    // Displace the UV coordinates for a water refraction effect
    vec2 displacedUv = uv + vec2(rippleDisplacement * 0.02);
    
    // Base water color with depth variation
    vec3 waterColor = mix(
        uBaseColor,
        uRippleColor,
        length(uv - vec2(0.5)) * 0.5 + rippleDisplacement * 2.0
    );
    
    // Add shimmer/specular highlights (audio-reactive)
    float shimmer = pow(sin(displacedUv.x * 40.0 + time) * 0.5 + 0.5, 8.0) * 
                   pow(sin(displacedUv.y * 30.0 - time * 0.7) * 0.5 + 0.5, 8.0);
    vec3 highlights = vec3(1.0, 1.0, 1.0) * shimmer * (0.2 + uHighLevel * 0.8);
    
    // Add subtle caustics pattern
    float caustics = sin(displacedUv.x * 20.0 + time) * sin(displacedUv.y * 20.0 + time * 0.7) * 0.5 + 0.5;
    caustics = pow(caustics, 2.0) * 0.1;
    
    // Combine effects
    vec3 finalColor = waterColor + highlights + vec3(0.0, 0.3, 0.6) * caustics;
    
    // Audio-reactive vignette
    float vignette = 1.0 - length(uv - vec2(0.5)) * (1.0 + uBassLevel * 0.5);
    vignette = smoothstep(0.0, 1.0, vignette);
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// Voronoi Pattern GLSL Version
export const voronoiFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;
uniform float uHighLevel;
uniform vec2 uResolution;
uniform vec3 uBaseColor;
uniform vec3 uCellColor;
uniform float uCellDensity;
uniform float uAnimationSpeed;

varying vec2 vUv;

// Hash function for pseudo-randomness
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
}

// Voronoi (cellular noise) function
float voronoi(vec2 x, float cellDensity) {
    x *= cellDensity;
    vec2 n = floor(x);
    vec2 f = fract(x);
    
    float distanceToClosest = 1.0;
    
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 gridPoint = vec2(float(i), float(j));
            vec2 pointPosition = hash(n + gridPoint);
            
            // Animate point position with time and audio
            pointPosition = 0.5 + 0.5 * sin(uTime * uAnimationSpeed * pointPosition);
            pointPosition += 0.15 * vec2(
                sin(uTime * uAnimationSpeed * (0.3 + uBassLevel) + pointPosition.x * 10.0),
                cos(uTime * uAnimationSpeed * (0.3 + uMidLevel) + pointPosition.y * 10.0)
            );
            
            vec2 difference = gridPoint + pointPosition - f;
            float distance = length(difference);
            distanceToClosest = min(distanceToClosest, distance);
        }
    }
    
    return distanceToClosest;
}

// F2 distance (second closest point)
float voronoiF2(vec2 x, float cellDensity) {
    x *= cellDensity;
    vec2 n = floor(x);
    vec2 f = fract(x);
    
    float distanceToClosest = 1.0;
    float distanceToSecondClosest = 1.0;
    
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 gridPoint = vec2(float(i), float(j));
            vec2 pointPosition = hash(n + gridPoint);
            
            // Animate point position with time and audio
            pointPosition = 0.5 + 0.5 * sin(uTime * uAnimationSpeed * pointPosition);
            
            vec2 difference = gridPoint + pointPosition - f;
            float distance = length(difference);
            
            if (distance < distanceToClosest) {
                distanceToSecondClosest = distanceToClosest;
                distanceToClosest = distance;
            } else if (distance < distanceToSecondClosest) {
                distanceToSecondClosest = distance;
            }
        }
    }
    
    return distanceToSecondClosest;
}

void main() {
    vec2 uv = vUv;
    float cellDensity = uCellDensity + uBassLevel * 2.0; // Audio-reactive cell density
    
    float cells1 = voronoi(uv, cellDensity);
    float cells2 = voronoiF2(uv, cellDensity * 0.8);
    
    // Calculate cell edges
    float edges = 1.0 - smoothstep(0.02, 0.05, cells2 - cells1);
    
    // Audio-reactive cell coloring
    vec3 cellColor = mix(
        uBaseColor,
        uCellColor,
        cells1 * (1.0 + uMidLevel)
    );
    
    // Edge highlighting (audio-reactive)
    vec3 edgeColor = mix(
        vec3(0.0, 0.5, 1.0),
        vec3(1.0, 0.3, 0.7),
        uHighLevel
    );
    
    // Audio-reactive pulse effect
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    float audioModulation = mix(0.2, 1.0, pulse * uBassLevel);
    
    // Combine effects
    vec3 finalColor = mix(
        cellColor,
        edgeColor,
        edges * audioModulation
    );
    
    // Vignette effect
    float vignette = 1.0 - length(uv - 0.5) * 0.8;
    vignette = smoothstep(0.0, 1.0, vignette);
    
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

// WGSL Versions (for WebGPU support)
export const waterRippleFragmentWGSL = /* wgsl */ `
@group(0) @binding(0) var<uniform> uTime: f32;
@group(0) @binding(1) var<uniform> uBassLevel: f32;
@group(0) @binding(2) var<uniform> uMidLevel: f32;
@group(0) @binding(3) var<uniform> uHighLevel: f32;
@group(0) @binding(4) var<uniform> uRippleSpeed: f32;
@group(0) @binding(5) var<uniform> uRippleStrength: f32;
@group(0) @binding(6) var<uniform> uBaseColor: vec3<f32>;
@group(0) @binding(7) var<uniform> uRippleColor: vec3<f32>;
@group(0) @binding(8) var<uniform> uMouse: vec2<f32>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

// Circular ripples
fn circularRipple(uv: vec2<f32>, center: vec2<f32>, time: f32, frequency: f32, amplitude: f32) -> f32 {
    let dist = length(uv - center);
    let ripple = sin(dist * frequency - time) * amplitude / dist;
    return ripple;
}

// Multiple ripples with audio reactivity
fn multipleRipples(uv: vec2<f32>, time: f32, audioLevel: f32) -> f32 {
    var ripples: f32 = 0.0;
    
    // Bass-driven ripple at center
    ripples += circularRipple(
        uv, 
        vec2<f32>(0.5, 0.5), 
        time * uRippleSpeed, 
        20.0 + uBassLevel * 10.0, 
        0.03 + uBassLevel * 0.03
    );
    
    // Mid-frequency ripples
    for (var i: i32 = 0; i < 3; i++) {
        let angle = f32(i) * 2.0 * 3.14159 / 3.0;
        let center = vec2<f32>(0.5) + vec2<f32>(cos(angle), sin(angle)) * 0.25;
        ripples += circularRipple(
            uv, 
            center, 
            time * uRippleSpeed * 0.7, 
            15.0 + uMidLevel * 8.0, 
            0.02 + uMidLevel * 0.02
        );
    }
    
    // High-frequency micro ripples
    for (var i: i32 = 0; i < 6; i++) {
        let angle = f32(i) * 2.0 * 3.14159 / 6.0 + time * 0.2;
        let center = vec2<f32>(0.5) + vec2<f32>(cos(angle), sin(angle)) * 0.35;
        ripples += circularRipple(
            uv, 
            center, 
            time * uRippleSpeed * 1.3, 
            30.0 + uHighLevel * 15.0, 
            0.01 + uHighLevel * 0.01
        );
    }
    
    // Mouse-driven ripple
    if (uMouse.x > 0.0 && uMouse.y > 0.0) {
        ripples += circularRipple(
            uv, 
            uMouse, 
            time * uRippleSpeed * 0.5, 
            25.0, 
            0.04 * uRippleStrength
        );
    }
    
    return ripples;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let uv = input.uv;
    let time = uTime;
    
    // Generate ripple displacement
    let rippleDisplacement = multipleRipples(uv, time, uBassLevel);
    
    // Displace the UV coordinates for a water refraction effect
    let displacedUv = uv + vec2<f32>(rippleDisplacement * 0.02);
    
    // Base water color with depth variation
    let waterColor = mix(
        uBaseColor,
        uRippleColor,
        length(uv - vec2<f32>(0.5)) * 0.5 + rippleDisplacement * 2.0
    );
    
    // Add shimmer/specular highlights (audio-reactive)
    let shimmer = pow(sin(displacedUv.x * 40.0 + time) * 0.5 + 0.5, 8.0) * 
                 pow(sin(displacedUv.y * 30.0 - time * 0.7) * 0.5 + 0.5, 8.0);
    let highlights = vec3<f32>(1.0, 1.0, 1.0) * shimmer * (0.2 + uHighLevel * 0.8);
    
    // Add subtle caustics pattern
    let caustics = sin(displacedUv.x * 20.0 + time) * sin(displacedUv.y * 20.0 + time * 0.7) * 0.5 + 0.5;
    let caustics_power = pow(caustics, 2.0) * 0.1;
    
    // Combine effects
    var finalColor = waterColor + highlights + vec3<f32>(0.0, 0.3, 0.6) * caustics_power;
    
    // Audio-reactive vignette
    let vignette = 1.0 - length(uv - vec2<f32>(0.5)) * (1.0 + uBassLevel * 0.5);
    let vignette_smooth = smoothstep(0.0, 1.0, vignette);
    finalColor = finalColor * vignette_smooth;
    
    return vec4<f32>(finalColor, 1.0);
}
`;
