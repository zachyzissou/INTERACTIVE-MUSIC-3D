// Fluid Blob Vertex Shader - WGSL
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) worldPosition: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) audioReactive: f32,
};

struct Uniforms {
    modelMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
    normalMatrix: mat3x3<f32>,
    time: f32,
    bassLevel: f32,
    midLevel: f32,
    trebleLevel: f32,
    viscosity: f32,
    wobbliness: f32,
    blobIntensity: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Simplex noise function for organic displacement
fn noise(p: vec3<f32>) -> f32 {
    let K1 = 0.333333333;
    let K2 = 0.166666667;
    
    let i = floor(p + (p.x + p.y + p.z) * K1);
    let a = p - i + (i.x + i.y + i.z) * K2;
    
    let o = step(a.yzx, a.xyz);
    let n = 1.0 - o;
    let p1 = min(o.xyz, n.zxy);
    let p2 = max(o.xyz, n.zxy);
    
    let c = max(0.5 - dot(a, a), 0.0);
    let c1 = max(0.5 - dot(a - p1, a - p1), 0.0);
    let c2 = max(0.5 - dot(a - p2, a - p2), 0.0);
    let c3 = max(0.5 - dot(a - 1.0, a - 1.0), 0.0);
    
    return pow(c, 4.0) + pow(c1, 4.0) + pow(c2, 4.0) + pow(c3, 4.0);
}

// Metaball field function
fn metaballField(pos: vec3<f32>) -> f32 {
    let center1 = vec3<f32>(sin(uniforms.time * 0.5) * 0.3, cos(uniforms.time * 0.7) * 0.2, 0.0);
    let center2 = vec3<f32>(-sin(uniforms.time * 0.3) * 0.2, -cos(uniforms.time * 0.6) * 0.3, sin(uniforms.time * 0.4) * 0.1);
    let center3 = vec3<f32>(cos(uniforms.time * 0.4) * 0.15, sin(uniforms.time * 0.8) * 0.15, -cos(uniforms.time * 0.5) * 0.2);
    
    let r1 = 0.4 + uniforms.bassLevel * 0.3;
    let r2 = 0.35 + uniforms.midLevel * 0.25;
    let r3 = 0.3 + uniforms.trebleLevel * 0.2;
    
    let d1 = length(pos - center1);
    let d2 = length(pos - center2);
    let d3 = length(pos - center3);
    
    return r1*r1 / (d1*d1 + 0.01) + r2*r2 / (d2*d2 + 0.01) + r3*r3 / (d3*d3 + 0.01);
}

// Cymatic pattern function
fn cymaticPattern(pos: vec3<f32>, frequency: f32) -> f32 {
    let radialDist = length(pos.xz);
    let angle = atan2(pos.z, pos.x);
    
    // Create standing wave patterns
    let radialWave = sin(radialDist * frequency * 8.0 - uniforms.time * 2.0) * 0.5 + 0.5;
    let angularWave = sin(angle * 6.0 + uniforms.time * 1.5) * 0.5 + 0.5;
    
    return radialWave * angularWave;
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    // Base position
    var pos = input.position;
    
    // Audio-reactive displacement
    let audioSum = uniforms.bassLevel + uniforms.midLevel + uniforms.trebleLevel;
    let audioFactor = audioSum * uniforms.blobIntensity;
    
    // Multi-octave noise for organic shape
    let noiseScale1 = 2.0 + uniforms.viscosity;
    let noiseScale2 = 4.0 + uniforms.wobbliness;
    let noiseScale3 = 8.0;
    
    let noisePos = pos + vec3<f32>(uniforms.time * 0.1);
    let n1 = noise(noisePos * noiseScale1) * 0.4;
    let n2 = noise(noisePos * noiseScale2) * 0.2;
    let n3 = noise(noisePos * noiseScale3) * 0.1;
    
    let combinedNoise = n1 + n2 + n3;
    
    // Metaball influence
    let metaballInfluence = metaballField(pos) * 0.15;
    
    // Cymatic patterns based on different frequencies
    let bassPattern = cymaticPattern(pos, uniforms.bassLevel * 0.5 + 1.0) * uniforms.bassLevel * 0.1;
    let midPattern = cymaticPattern(pos, uniforms.midLevel * 0.7 + 1.5) * uniforms.midLevel * 0.08;
    let treblePattern = cymaticPattern(pos, uniforms.trebleLevel * 1.0 + 2.0) * uniforms.trebleLevel * 0.06;
    
    // Combine all displacement effects
    let totalDisplacement = (combinedNoise + metaballInfluence + bassPattern + midPattern + treblePattern) * audioFactor;
    
    // Apply displacement along normal for organic bulging
    pos += input.normal * totalDisplacement * 0.8;
    
    // Additional radial displacement for blob-like expansion
    let radialDisplacement = (audioSum * 0.1 + sin(uniforms.time * 1.5) * 0.05) * uniforms.blobIntensity;
    pos += normalize(pos) * radialDisplacement;
    
    // Transform to world space
    let worldPos = uniforms.modelMatrix * vec4<f32>(pos, 1.0);
    output.worldPosition = worldPos.xyz;
    
    // Transform normal
    output.normal = normalize(uniforms.normalMatrix * input.normal);
    
    // Final position
    output.position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;
    output.uv = input.uv;
    output.audioReactive = audioFactor;
    
    return output;
}

@fragment  
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let normal = normalize(input.normal);
    
    // Audio-reactive color shifts
    let bassColor = vec3<f32>(1.0, 0.3, 0.6) * uniforms.bassLevel;
    let midColor = vec3<f32>(0.3, 1.0, 0.8) * uniforms.midLevel;
    let trebleColor = vec3<f32>(0.6, 0.8, 1.0) * uniforms.trebleLevel;
    
    let baseColor = vec3<f32>(0.4, 0.7, 1.0);
    let audioColor = (bassColor + midColor + trebleColor) * 0.5;
    let finalColor = mix(baseColor, audioColor, input.audioReactive);
    
    // Fresnel effect for glass-like appearance
    let viewDir = normalize(-input.worldPosition);
    let fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
    
    // Iridescent shift based on viewing angle and audio
    let iridescence = sin(fresnel * 10.0 + uniforms.time * 2.0 + input.audioReactive * 5.0) * 0.1 + 0.9;
    
    return vec4<f32>(finalColor * iridescence, 0.85 + fresnel * 0.15);
}