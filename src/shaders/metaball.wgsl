// Metaball Shader - Organic blob effects for audio visualization
struct Uniforms {
  time: f32,
  resolution: vec2<f32>,
  audioFrequency: f32,
  audioAmplitude: f32,
  bassLevel: f32,
  midLevel: f32,
  trebleLevel: f32,
  colorShift: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

// Smooth minimum function for metaball blending
fn smoothMin(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Distance function for a sphere
fn sdSphere(p: vec3<f32>, center: vec3<f32>, radius: f32) -> f32 {
  return length(p - center) - radius;
}

// Metaball field function
fn metaballField(p: vec3<f32>) -> f32 {
  var d = 1000.0;
  
  // Create multiple metaballs that respond to audio
  for (var i = 0; i < 5; i++) {
    let fi = f32(i);
    let t = uniforms.time + fi * 0.7;
    
    // Audio-reactive positioning
    let audioOffset = sin(t * 0.5 + uniforms.bassLevel * 3.0) * 0.3;
    let center = vec3<f32>(
      sin(t * 1.1 + fi) * 2.0 + audioOffset,
      cos(t * 0.9 + fi * 1.5) * 2.0,
      sin(t * 0.7 + fi * 0.8) * 1.5
    );
    
    // Audio-reactive radius
    let radius = 0.8 + uniforms.audioAmplitude * 0.3 + sin(t * 2.0 + fi) * 0.2;
    
    // Blend metaballs
    d = smoothMin(d, sdSphere(p, center, radius), 0.7);
  }
  
  return d;
}

// Calculate normal using gradient
fn calcNormal(p: vec3<f32>) -> vec3<f32> {
  let e = 0.001;
  return normalize(vec3<f32>(
    metaballField(p + vec3<f32>(e, 0.0, 0.0)) - metaballField(p - vec3<f32>(e, 0.0, 0.0)),
    metaballField(p + vec3<f32>(0.0, e, 0.0)) - metaballField(p - vec3<f32>(0.0, e, 0.0)),
    metaballField(p + vec3<f32>(0.0, 0.0, e)) - metaballField(p - vec3<f32>(0.0, 0.0, e))
  ));
}

// Ray marching
fn rayMarch(ro: vec3<f32>, rd: vec3<f32>) -> f32 {
  var t = 0.0;
  
  for (var i = 0; i < 64; i++) {
    let p = ro + rd * t;
    let d = metaballField(p);
    
    if (d < 0.001 || t > 20.0) {
      break;
    }
    
    t += d * 0.8;
  }
  
  return t;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let dims = textureDimensions(outputTexture);
  let coords = vec2<f32>(f32(id.x), f32(id.y));
  
  if (id.x >= dims.x || id.y >= dims.y) {
    return;
  }
  
  // Normalized coordinates
  let uv = (coords - uniforms.resolution * 0.5) / min(uniforms.resolution.x, uniforms.resolution.y);
  
  // Camera setup
  let ro = vec3<f32>(0.0, 0.0, 5.0);
  let rd = normalize(vec3<f32>(uv.x, uv.y, -1.5));
  
  // Ray march
  let t = rayMarch(ro, rd);
  
  var color = vec3<f32>(0.0);
  
  if (t < 20.0) {
    let p = ro + rd * t;
    let n = calcNormal(p);
    
    // Lighting
    let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
    let diff = max(dot(n, lightDir), 0.0);
    let spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 32.0);
    
    // Audio-reactive color
    let hue = uniforms.time * 0.1 + uniforms.colorShift + uniforms.bassLevel * 0.5;
    let baseColor = hsv2rgb(vec3<f32>(hue, 0.8, 0.9));
    
    color = baseColor * (diff * 0.8 + 0.2) + vec3<f32>(1.0) * spec * 0.5;
    
    // Add rim lighting
    let rim = 1.0 - max(dot(n, -rd), 0.0);
    color += vec3<f32>(0.3, 0.6, 1.0) * pow(rim, 2.0) * uniforms.trebleLevel;
  }
  
  // Background gradient
  let bg = mix(
    vec3<f32>(0.02, 0.02, 0.05),
    vec3<f32>(0.1, 0.05, 0.2),
    1.0 - uv.y * 0.5 + 0.5
  );
  
  color = mix(bg, color, smoothstep(20.0, 19.0, t));
  
  // Output
  textureStore(outputTexture, vec2<i32>(i32(id.x), i32(id.y)), vec4<f32>(color, 1.0));
}

// HSV to RGB conversion
fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
  let k = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
  return c.z * mix(k.xxx, clamp(p - k.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}