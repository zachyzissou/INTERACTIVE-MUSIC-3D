// Volumetric Lighting and God Rays Shader - WGSL
struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) worldPos: vec3<f32>,
};

struct Uniforms {
    viewMatrix: mat4x4<f32>,
    projectionMatrix: mat4x4<f32>,
    cameraPosition: vec3<f32>,
    time: f32,
    lightPosition: vec3<f32>,
    lightColor: vec3<f32>,
    lightIntensity: f32,
    bassLevel: f32,
    midLevel: f32,
    trebleLevel: f32,
    audioReactivity: f32,
    scatteringStrength: f32,
    rayMarchSteps: i32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var sceneTexture: texture_2d<f32>;
@group(0) @binding(2) var sceneSampler: sampler;
@group(0) @binding(3) var depthTexture: texture_depth_2d;

// Noise function for volumetric scattering
fn noise3D(p: vec3<f32>) -> f32 {
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

// Volumetric scattering calculation
fn calculateVolumetricScattering(rayStart: vec3<f32>, rayDir: vec3<f32>, rayLength: f32) -> f32 {
    let stepSize = rayLength / f32(uniforms.rayMarchSteps);
    var totalScattering = 0.0;
    
    for (var i = 0; i < uniforms.rayMarchSteps; i++) {
        let t = f32(i) * stepSize;
        let samplePos = rayStart + rayDir * t;
        
        // Distance to light for attenuation
        let lightVec = uniforms.lightPosition - samplePos;
        let lightDist = length(lightVec);
        let lightDir = lightVec / lightDist;
        
        // Light attenuation
        let attenuation = 1.0 / (1.0 + lightDist * lightDist * 0.01);
        
        // Audio-reactive density modulation
        let audioNoise = noise3D(samplePos * 2.0 + vec3<f32>(uniforms.time * 0.5));
        let audioDensity = (uniforms.bassLevel * 0.4 + uniforms.midLevel * 0.3 + uniforms.trebleLevel * 0.3) * uniforms.audioReactivity;
        let density = (0.1 + audioNoise * 0.2 + audioDensity * 0.5) * uniforms.scatteringStrength;
        
        // Phase function (Henyey-Greenstein)
        let cosTheta = dot(-rayDir, lightDir);
        let g = 0.3; // Forward scattering
        let phaseFunction = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * cosTheta, 1.5);
        
        // Scattering contribution
        totalScattering += density * attenuation * phaseFunction * stepSize;
    }
    
    return totalScattering;
}

// God rays effect
fn calculateGodRays(screenPos: vec2<f32>, lightScreenPos: vec2<f32>) -> f32 {
    let rayDir = normalize(lightScreenPos - screenPos);
    let rayLength = length(lightScreenPos - screenPos);
    
    var rayIntensity = 0.0;
    let numSamples = 100;
    
    for (var i = 0; i < numSamples; i++) {
        let t = f32(i) / f32(numSamples);
        let samplePos = screenPos + rayDir * rayLength * t;
        
        // Sample scene depth
        let depth = textureSample(depthTexture, sceneSampler, samplePos).r;
        
        // If ray hits geometry, attenuate
        if (depth < 1.0) {
            rayIntensity *= 0.95;
        } else {
            rayIntensity += 0.01;
        }
    }
    
    return rayIntensity;
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    
    output.position = vec4<f32>(input.position.xy, 0.0, 1.0);
    output.uv = input.uv;
    output.worldPos = input.position;
    
    return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // Sample the scene
    let sceneColor = textureSample(sceneTexture, sceneSampler, input.uv).rgb;
    
    // Calculate world position from screen space
    let screenPos = input.uv * 2.0 - 1.0;
    let worldPos = input.worldPos;
    
    // Ray from camera to fragment
    let rayDir = normalize(worldPos - uniforms.cameraPosition);
    let rayLength = length(worldPos - uniforms.cameraPosition);
    
    // Calculate volumetric scattering
    let scattering = calculateVolumetricScattering(uniforms.cameraPosition, rayDir, rayLength);
    
    // Transform light position to screen space for god rays
    let lightClipPos = uniforms.projectionMatrix * uniforms.viewMatrix * vec4<f32>(uniforms.lightPosition, 1.0);
    let lightScreenPos = (lightClipPos.xy / lightClipPos.w) * 0.5 + 0.5;
    
    // Calculate god rays
    var godRays = 0.0;
    if (lightClipPos.z > 0.0) {
        godRays = calculateGodRays(input.uv, lightScreenPos);
    }
    
    // Audio-reactive color modulation
    let audioColorShift = vec3<f32>(
        uniforms.bassLevel * 0.8 + 0.2,
        uniforms.midLevel * 0.6 + 0.4,
        uniforms.trebleLevel * 0.9 + 0.1
    );
    
    // Combine effects
    let volumetricColor = uniforms.lightColor * audioColorShift * scattering * uniforms.lightIntensity;
    let godRayColor = uniforms.lightColor * godRays * 0.3;
    
    // Final color composition
    let finalColor = sceneColor + volumetricColor + godRayColor;
    
    return vec4<f32>(finalColor, 1.0);
}