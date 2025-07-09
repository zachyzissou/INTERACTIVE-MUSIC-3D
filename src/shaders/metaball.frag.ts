// Advanced Metaball Fragment Shader - WGSL/GLSL Compatible
// Inspired by the best interactive 3D experiences

// GLSL Version
export const metaballFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uBassLevel;
uniform float uMidLevel;  
uniform float uHighLevel;
uniform vec2 uResolution;
uniform vec3 uColorPrimary;
uniform vec3 uColorSecondary;
uniform float uMetaballCount;
uniform float uGlowIntensity;

varying vec2 vUv;

// Enhanced noise function for organic movement
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    float a = dot(i, vec2(12.9898, 78.233));
    float b = dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233));
    float c = dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233));
    float d = dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(fract(sin(a) * 43758.5453), fract(sin(b) * 43758.5453), u.x),
        mix(fract(sin(c) * 43758.5453), fract(sin(d) * 43758.5453), u.x),
        u.y
    );
}

// Audio-reactive metaball with organic deformation
float metaball(vec2 uv, vec2 center, float radius, float audioLevel) {
    vec2 pos = center + vec2(
        noise(center * 3.0 + uTime * 0.5) * 0.2 * audioLevel,
        noise(center * 2.0 + uTime * 0.3) * 0.15 * audioLevel
    );
    
    float dist = length(uv - pos);
    float organicRadius = radius * (1.0 + audioLevel * 0.3 + noise(uv * 8.0 + uTime) * 0.1);
    
    return organicRadius / (dist + 0.001);
}

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    
    // Audio-reactive metaball positions
    float field = 0.0;
    
    // Primary metaball (bass-reactive)
    field += metaball(uv, vec2(0.5 + sin(uTime * 0.5) * 0.3, 0.5), 
                     0.15 + uBassLevel * 0.1, uBassLevel);
    
    // Secondary metaballs (mid/high frequency reactive)
    field += metaball(uv, vec2(0.3 + cos(uTime * 0.8) * 0.2, 0.7), 
                     0.1 + uMidLevel * 0.08, uMidLevel);
                     
    field += metaball(uv, vec2(0.7 + sin(uTime * 1.2) * 0.25, 0.3), 
                     0.08 + uHighLevel * 0.06, uHighLevel);
    
    // Additional dynamic metaballs
    for (float i = 0.0; i < uMetaballCount; i++) {
        float angle = i * 6.28318 / uMetaballCount + uTime * 0.3;
        vec2 pos = vec2(cos(angle), sin(angle)) * 0.3 + vec2(0.5);
        field += metaball(uv, pos, 0.05, (uBassLevel + uMidLevel) * 0.5);
    }
    
    // Color mixing with audio reactivity
    vec3 color1 = uColorPrimary * (1.0 + uBassLevel);
    vec3 color2 = uColorSecondary * (1.0 + uHighLevel);
    
    float intensity = smoothstep(0.5, 1.5, field);
    vec3 finalColor = mix(color1, color2, intensity);
    
    // Neon glow effect
    float glow = exp(-length(center) * (2.0 - uGlowIntensity));
    finalColor += vec3(0.0, 0.8, 1.0) * glow * uMidLevel * 0.5;
    
    // Audio-reactive edge enhancement
    float edge = fwidth(field) * 10.0;
    finalColor += vec3(1.0, 0.2, 0.8) * edge * uHighLevel;
    
    gl_FragColor = vec4(finalColor, intensity);
}
`;

// WGSL Version for WebGPU
export const metaballFragmentShaderWGSL = /* wgsl */ `
struct FragmentInput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct Uniforms {
    time: f32,
    bassLevel: f32,
    midLevel: f32,
    highLevel: f32,
    resolution: vec2<f32>,
    colorPrimary: vec3<f32>,
    colorSecondary: vec3<f32>,
    metaballCount: f32,
    glowIntensity: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    
    let a = dot(i, vec2<f32>(12.9898, 78.233));
    let b = dot(i + vec2<f32>(1.0, 0.0), vec2<f32>(12.9898, 78.233));
    let c = dot(i + vec2<f32>(0.0, 1.0), vec2<f32>(12.9898, 78.233));
    let d = dot(i + vec2<f32>(1.0, 1.0), vec2<f32>(12.9898, 78.233));
    
    let u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(fract(sin(a) * 43758.5453), fract(sin(b) * 43758.5453), u.x),
        mix(fract(sin(c) * 43758.5453), fract(sin(d) * 43758.5453), u.x),
        u.y
    );
}

fn metaball(uv: vec2<f32>, center: vec2<f32>, radius: f32, audioLevel: f32) -> f32 {
    let pos = center + vec2<f32>(
        noise(center * 3.0 + uniforms.time * 0.5) * 0.2 * audioLevel,
        noise(center * 2.0 + uniforms.time * 0.3) * 0.15 * audioLevel
    );
    
    let dist = length(uv - pos);
    let organicRadius = radius * (1.0 + audioLevel * 0.3 + noise(uv * 8.0 + uniforms.time) * 0.1);
    
    return organicRadius / (dist + 0.001);
}

@fragment
fn fs_main(input: FragmentInput) -> @location(0) vec4<f32> {
    let uv = input.uv;
    let center = uv - vec2<f32>(0.5);
    
    var field = 0.0;
    
    // Audio-reactive metaballs
    field += metaball(uv, vec2<f32>(0.5 + sin(uniforms.time * 0.5) * 0.3, 0.5), 
                     0.15 + uniforms.bassLevel * 0.1, uniforms.bassLevel);
    
    field += metaball(uv, vec2<f32>(0.3 + cos(uniforms.time * 0.8) * 0.2, 0.7), 
                     0.1 + uniforms.midLevel * 0.08, uniforms.midLevel);
                     
    field += metaball(uv, vec2<f32>(0.7 + sin(uniforms.time * 1.2) * 0.25, 0.3), 
                     0.08 + uniforms.highLevel * 0.06, uniforms.highLevel);
    
    // Dynamic metaballs
    for (var i = 0.0; i < uniforms.metaballCount; i += 1.0) {
        let angle = i * 6.28318 / uniforms.metaballCount + uniforms.time * 0.3;
        let pos = vec2<f32>(cos(angle), sin(angle)) * 0.3 + vec2<f32>(0.5);
        field += metaball(uv, pos, 0.05, (uniforms.bassLevel + uniforms.midLevel) * 0.5);
    }
    
    let color1 = uniforms.colorPrimary * (1.0 + uniforms.bassLevel);
    let color2 = uniforms.colorSecondary * (1.0 + uniforms.highLevel);
    
    let intensity = smoothstep(0.5, 1.5, field);
    var finalColor = mix(color1, color2, intensity);
    
    // Neon glow
    let glow = exp(-length(center) * (2.0 - uniforms.glowIntensity));
    finalColor += vec3<f32>(0.0, 0.8, 1.0) * glow * uniforms.midLevel * 0.5;
    
    return vec4<f32>(finalColor, intensity);
}
`;