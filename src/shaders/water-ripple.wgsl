// Water Ripple Shader - Audio-reactive water simulation
struct Uniforms {
  time: f32,
  resolution: vec2<f32>,
  audioData: array<f32, 32>,
  ripplePoints: array<vec4<f32>, 16>, // xy: position, z: time, w: amplitude
  flowSpeed: f32,
  waveHeight: f32,
  refractionStrength: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var backgroundTexture: texture_2d<f32>;
@group(0) @binding(2) var textureSampler: sampler;
@group(0) @binding(3) var outputTexture: texture_storage_2d<rgba8unorm, write>;

// Wave function for ripples
fn waveHeight(p: vec2<f32>, center: vec2<f32>, time: f32, amplitude: f32) -> f32 {
  let dist = length(p - center);
  let wave = sin(dist * 15.0 - time * 8.0) * exp(-dist * 2.0);
  return wave * amplitude;
}

// Calculate water surface normal
fn waterNormal(p: vec2<f32>) -> vec3<f32> {
  let eps = 0.001;
  var height = 0.0;
  var heightX = 0.0;
  var heightY = 0.0;
  
  // Accumulate ripples from all points
  for (var i = 0; i < 16; i++) {
    let ripple = uniforms.ripplePoints[i];
    if (ripple.w > 0.0) {
      let age = uniforms.time - ripple.z;
      let fade = exp(-age * 0.5);
      
      height += waveHeight(p, ripple.xy, age, ripple.w * fade);
      heightX += waveHeight(p + vec2<f32>(eps, 0.0), ripple.xy, age, ripple.w * fade);
      heightY += waveHeight(p + vec2<f32>(0.0, eps), ripple.xy, age, ripple.w * fade);
    }
  }
  
  // Add flowing water waves
  let flow = uniforms.time * uniforms.flowSpeed;
  height += sin(p.x * 10.0 + flow) * sin(p.y * 8.0 - flow * 0.7) * 0.1;
  heightX += sin((p.x + eps) * 10.0 + flow) * sin(p.y * 8.0 - flow * 0.7) * 0.1;
  heightY += sin(p.x * 10.0 + flow) * sin((p.y + eps) * 8.0 - flow * 0.7) * 0.1;
  
  // Audio-reactive waves
  let audioWave = uniforms.audioData[i32(p.x * 32.0) % 32] * uniforms.waveHeight;
  height += audioWave * sin(p.y * 20.0 + uniforms.time * 3.0);
  
  // Calculate normal from height differences
  let dx = (heightX - height) / eps;
  let dy = (heightY - height) / eps;
  
  return normalize(vec3<f32>(-dx, -dy, 1.0));
}

// Fresnel effect
fn fresnel(normal: vec3<f32>, viewDir: vec3<f32>, ior: f32) -> f32 {
  let f0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
  let cosTheta = max(dot(normal, viewDir), 0.0);
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let dims = textureDimensions(outputTexture);
  let coords = vec2<f32>(f32(id.x), f32(id.y));
  
  if (id.x >= dims.x || id.y >= dims.y) {
    return;
  }
  
  let uv = coords / uniforms.resolution;
  let normal = waterNormal(uv);
  
  // View direction (assuming orthographic view)
  let viewDir = vec3<f32>(0.0, 0.0, 1.0);
  
  // Refraction
  let refractionOffset = normal.xy * uniforms.refractionStrength;
  let refractedUV = uv + refractionOffset;
  
  // Sample background with refraction
  var bgColor = textureSample(backgroundTexture, textureSampler, refractedUV).rgb;
  
  // Underwater color tint
  bgColor *= vec3<f32>(0.7, 0.9, 1.0);
  
  // Reflection
  let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
  let reflectDir = reflect(-lightDir, normal);
  let spec = pow(max(dot(reflectDir, viewDir), 0.0), 64.0);
  
  // Caustics
  let causticUV = uv * 10.0 + uniforms.time * 0.5;
  let caustic1 = sin(causticUV.x + sin(causticUV.y));
  let caustic2 = sin(causticUV.y * 1.3 + sin(causticUV.x * 1.7));
  let caustics = max(caustic1 * caustic2, 0.0);
  
  // Combine effects
  var color = bgColor;
  color += vec3<f32>(1.0) * spec * 0.8; // Specular highlights
  color += vec3<f32>(0.5, 0.7, 1.0) * caustics * 0.2; // Caustic lighting
  
  // Fresnel-based transparency
  let fresnelFactor = fresnel(normal, viewDir, 1.33);
  color = mix(bgColor, color, fresnelFactor * 0.7 + 0.3);
  
  // Edge foam
  var foam = 0.0;
  for (var i = 0; i < 16; i++) {
    let ripple = uniforms.ripplePoints[i];
    if (ripple.w > 0.0) {
      let dist = length(uv - ripple.xy);
      let age = uniforms.time - ripple.z;
      let ringDist = age * 0.5;
      foam += exp(-abs(dist - ringDist) * 20.0) * exp(-age * 0.3);
    }
  }
  color += vec3<f32>(1.0) * foam * 0.5;
  
  // Audio-reactive shimmer
  let shimmer = sin(uv.x * 100.0 + uniforms.time * 10.0) * 
                sin(uv.y * 100.0 - uniforms.time * 7.0);
  let audioShimmer = uniforms.audioData[i32(uv.x * 32.0) % 32];
  color += vec3<f32>(0.3, 0.5, 1.0) * shimmer * audioShimmer * 0.1;
  
  // Output
  textureStore(outputTexture, vec2<i32>(i32(id.x), i32(id.y)), vec4<f32>(color, 1.0));
}