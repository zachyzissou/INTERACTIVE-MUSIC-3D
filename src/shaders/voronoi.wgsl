// Voronoi Shader - Cellular patterns for audio visualization
struct Uniforms {
  time: f32,
  resolution: vec2<f32>,
  audioData: array<f32, 32>, // FFT bins
  mousePos: vec2<f32>,
  complexity: f32,
  colorMode: i32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

// Hash function for randomness
fn hash2(p: vec2<f32>) -> vec2<f32> {
  let k = vec2<f32>(0.3183099, 0.3678794);
  var p2 = p;
  p2 = p2 * k + k.yx;
  return -1.0 + 2.0 * fract(16.0 * k * fract(p2.x * p2.y * (p2.x + p2.y)));
}

// 3D noise for variation
fn noise3(p: vec3<f32>) -> f32 {
  let s = vec3<f32>(7.0, 157.0, 113.0);
  let ip = floor(p);
  var fp = fract(p);
  fp = fp * fp * (3.0 - 2.0 * fp);
  
  var result = 0.0;
  for (var i = 0; i < 2; i++) {
    for (var j = 0; j < 2; j++) {
      for (var k = 0; k < 2; k++) {
        let offset = vec3<f32>(f32(i), f32(j), f32(k));
        let h = dot(ip + offset, s);
        let n = fract(sin(h) * 43758.5453);
        let weight = fp.x * f32(i) + (1.0 - fp.x) * f32(1 - i);
        weight *= fp.y * f32(j) + (1.0 - fp.y) * f32(1 - j);
        weight *= fp.z * f32(k) + (1.0 - fp.z) * f32(1 - k);
        result += n * weight;
      }
    }
  }
  
  return result;
}

// Voronoi distance function
fn voronoi(p: vec2<f32>, time: f32) -> vec3<f32> {
  let n = floor(p);
  let f = fract(p);
  
  var minDist1 = 1e20;
  var minDist2 = 1e20;
  var cellColor = vec3<f32>(0.0);
  var cellId = vec2<f32>(0.0);
  
  // Check neighboring cells
  for (var j = -1; j <= 1; j++) {
    for (var i = -1; i <= 1; i++) {
      let neighbor = vec2<f32>(f32(i), f32(j));
      let cellPos = n + neighbor;
      
      // Audio-reactive cell animation
      let audioIndex = i32(abs(cellPos.x + cellPos.y * 10.0)) % 32;
      let audioLevel = uniforms.audioData[audioIndex];
      
      // Animated cell center
      let randOffset = hash2(cellPos);
      let animOffset = vec2<f32>(
        sin(time * 1.3 + randOffset.x * 6.28) * 0.1,
        cos(time * 0.9 + randOffset.y * 6.28) * 0.1
      ) * audioLevel;
      
      let point = neighbor + randOffset * 0.5 + 0.5 + animOffset;
      let diff = point - f;
      let dist = length(diff);
      
      if (dist < minDist1) {
        minDist2 = minDist1;
        minDist1 = dist;
        cellId = cellPos;
        
        // Color based on cell properties and audio
        let hue = fract(dot(cellPos, vec2<f32>(0.113, 0.247)) + time * 0.05);
        let sat = 0.6 + audioLevel * 0.4;
        let val = 0.7 + audioLevel * 0.3;
        cellColor = hsv2rgb(vec3<f32>(hue, sat, val));
      } else if (dist < minDist2) {
        minDist2 = dist;
      }
    }
  }
  
  return vec3<f32>(minDist1, minDist2, length(cellId));
}

// Main compute function
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let dims = textureDimensions(outputTexture);
  let coords = vec2<f32>(f32(id.x), f32(id.y));
  
  if (id.x >= dims.x || id.y >= dims.y) {
    return;
  }
  
  let uv = coords / uniforms.resolution;
  let aspect = uniforms.resolution.x / uniforms.resolution.y;
  var p = uv * uniforms.complexity;
  p.x *= aspect;
  
  // Multiple layers of voronoi
  let v1 = voronoi(p * 1.0, uniforms.time);
  let v2 = voronoi(p * 2.1 + vec2<f32>(1.3, 2.7), uniforms.time * 1.3);
  let v3 = voronoi(p * 4.3 + vec2<f32>(3.1, 1.7), uniforms.time * 0.7);
  
  var color = vec3<f32>(0.0);
  
  // Different visualization modes
  switch (uniforms.colorMode) {
    case 0: { // Classic Voronoi
      let edge = smoothstep(0.0, 0.05, v1.y - v1.x);
      color = mix(vec3<f32>(0.0), v1.z * vec3<f32>(0.3, 0.5, 1.0), edge);
    }
    case 1: { // Organic cells
      let n = noise3(vec3<f32>(p * 3.0, uniforms.time * 0.5));
      let edge = smoothstep(0.0, 0.1, (v1.y - v1.x) * (1.0 + n * 0.5));
      color = mix(v1.z * vec3<f32>(1.0, 0.3, 0.5), vec3<f32>(0.1), edge);
    }
    case 2: { // Multi-layer
      let layer1 = smoothstep(0.0, 0.05, v1.y - v1.x);
      let layer2 = smoothstep(0.0, 0.03, v2.y - v2.x);
      let layer3 = smoothstep(0.0, 0.02, v3.y - v3.x);
      color = vec3<f32>(layer1 * 0.5, layer2 * 0.7, layer3 * 1.0);
    }
    default: {
      color = vec3<f32>(v1.x, v1.y, 0.5);
    }
  }
  
  // Audio reactive brightness
  let avgAudio = arrayAverage(uniforms.audioData);
  color *= 0.8 + avgAudio * 0.4;
  
  // Distance-based glow from mouse
  let mouseDist = length((coords - uniforms.mousePos) / uniforms.resolution);
  color += vec3<f32>(0.2, 0.4, 0.8) * exp(-mouseDist * 5.0) * 0.5;
  
  // Output
  textureStore(outputTexture, vec2<i32>(i32(id.x), i32(id.y)), vec4<f32>(color, 1.0));
}

// Helper functions
fn hsv2rgb(c: vec3<f32>) -> vec3<f32> {
  let k = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  let p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
  return c.z * mix(k.xxx, clamp(p - k.xxx, vec3<f32>(0.0), vec3<f32>(1.0)), c.y);
}

fn arrayAverage(arr: array<f32, 32>) -> f32 {
  var sum = 0.0;
  for (var i = 0; i < 32; i++) {
    sum += arr[i];
  }
  return sum / 32.0;
}