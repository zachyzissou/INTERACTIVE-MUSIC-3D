struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) world_position: vec3<f32>,
  @location(1) world_normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) view_position: vec3<f32>,
}

struct Camera {
  view_proj: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  position: vec3<f32>,
  _padding: f32,
}

struct Uniforms {
  time: f32,
  audio_level: f32,
  bass: f32,
  mid: f32,
  treble: f32,
  beat_intensity: f32,
  color_hue: f32,
  material_metalness: f32,
  material_roughness: f32,
  emission_strength: f32,
  _padding: vec2<f32>,
}

struct Light {
  position: vec3<f32>,
  _padding1: f32,
  color: vec3<f32>,
  intensity: f32,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(3) var<uniform> lights: array<Light, 6>;
@group(1) @binding(0) var environment_map: texture_cube<f32>;
@group(1) @binding(1) var environment_sampler: sampler;

// Procedural noise functions
fn hash(p: vec3<f32>) -> f32 {
  var p3 = fract(p * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

fn noise(p: vec3<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  
  return mix(
    mix(
      mix(hash(i + vec3<f32>(0.0, 0.0, 0.0)), hash(i + vec3<f32>(1.0, 0.0, 0.0)), u.x),
      mix(hash(i + vec3<f32>(0.0, 1.0, 0.0)), hash(i + vec3<f32>(1.0, 1.0, 0.0)), u.x), u.y),
    mix(
      mix(hash(i + vec3<f32>(0.0, 0.0, 1.0)), hash(i + vec3<f32>(1.0, 0.0, 1.0)), u.x),
      mix(hash(i + vec3<f32>(0.0, 1.0, 1.0)), hash(i + vec3<f32>(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

fn fbm(p: vec3<f32>) -> f32 {
  var value = 0.0;
  var amplitude = 0.5;
  var frequency = 1.0;
  
  for (var i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}

// HSV to RGB conversion
fn hsv_to_rgb(hsv: vec3<f32>) -> vec3<f32> {
  let c = hsv.z * hsv.y;
  let x = c * (1.0 - abs(((hsv.x / 60.0) % 2.0) - 1.0));
  let m = hsv.z - c;
  
  var rgb: vec3<f32>;
  if (hsv.x < 60.0) {
    rgb = vec3<f32>(c, x, 0.0);
  } else if (hsv.x < 120.0) {
    rgb = vec3<f32>(x, c, 0.0);
  } else if (hsv.x < 180.0) {
    rgb = vec3<f32>(0.0, c, x);
  } else if (hsv.x < 240.0) {
    rgb = vec3<f32>(0.0, x, c);
  } else if (hsv.x < 300.0) {
    rgb = vec3<f32>(x, 0.0, c);
  } else {
    rgb = vec3<f32>(c, 0.0, x);
  }
  
  return rgb + m;
}

// PBR lighting calculation
fn calculate_pbr_lighting(
  albedo: vec3<f32>,
  metalness: f32,
  roughness: f32,
  normal: vec3<f32>,
  view_dir: vec3<f32>,
  world_pos: vec3<f32>
) -> vec3<f32> {
  let f0 = mix(vec3<f32>(0.04), albedo, metalness);
  var color = vec3<f32>(0.0);
  
  // Calculate lighting from all light sources
  for (var i = 0; i < 6; i++) {
    let light_dir = normalize(lights[i].position - world_pos);
    let half_dir = normalize(light_dir + view_dir);
    let distance = length(lights[i].position - world_pos);
    let attenuation = 1.0 / (distance * distance);
    let radiance = lights[i].color * lights[i].intensity * attenuation;
    
    // BRDF components
    let ndotl = max(dot(normal, light_dir), 0.0);
    let ndotv = max(dot(normal, view_dir), 0.0);
    let ndoth = max(dot(normal, half_dir), 0.0);
    let vdoth = max(dot(view_dir, half_dir), 0.0);
    
    // Fresnel
    let f = f0 + (1.0 - f0) * pow(1.0 - vdoth, 5.0);
    
    // Distribution
    let alpha = roughness * roughness;
    let alpha2 = alpha * alpha;
    let denom = ndoth * ndoth * (alpha2 - 1.0) + 1.0;
    let d = alpha2 / (3.14159265359 * denom * denom);
    
    // Geometry
    let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    let g1l = ndotl / (ndotl * (1.0 - k) + k);
    let g1v = ndotv / (ndotv * (1.0 - k) + k);
    let g = g1l * g1v;
    
    // BRDF
    let numerator = d * g * f;
    let denominator = 4.0 * ndotv * ndotl + 0.001;
    let specular = numerator / denominator;
    
    let ks = f;
    let kd = (1.0 - ks) * (1.0 - metalness);
    
    color += (kd * albedo / 3.14159265359 + specular) * radiance * ndotl;
  }
  
  // Environment lighting
  let reflection = reflect(-view_dir, normal);
  let env_color = textureSample(environment_map, environment_sampler, reflection).rgb;
  color += env_color * 0.1 * mix(albedo, f0, metalness);
  
  return color;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let view_dir = normalize(camera.position - input.world_position);
  let normal = normalize(input.world_normal);
  
  // Procedural surface patterns
  let world_noise = fbm(input.world_position * 2.0 + uniforms.time * 0.1);
  let time_noise = fbm(input.world_position * 1.5 + vec3<f32>(uniforms.time * 0.3));
  
  // Audio-reactive color shifting
  let base_hue = uniforms.color_hue + uniforms.bass * 0.002 + time_noise * 30.0;
  let saturation = 0.8 + uniforms.mid * 0.001;
  let brightness = 0.7 + uniforms.treble * 0.001 + world_noise * 0.2;
  
  let base_color = hsv_to_rgb(vec3<f32>(base_hue, saturation, brightness));
  
  // Audio-reactive material properties
  let metalness = uniforms.material_metalness + uniforms.bass * 0.002;
  let roughness = uniforms.material_roughness + world_noise * 0.3;
  
  // Calculate PBR lighting
  var final_color = calculate_pbr_lighting(
    base_color,
    clamp(metalness, 0.0, 1.0),
    clamp(roughness, 0.05, 1.0),
    normal,
    view_dir,
    input.world_position
  );
  
  // Audio-reactive emission
  let emission_pattern = sin(input.world_position.x * 4.0 + uniforms.time) * 
                        cos(input.world_position.y * 4.0 + uniforms.time * 1.3) * 
                        sin(input.world_position.z * 4.0 + uniforms.time * 0.7);
  
  let emission_intensity = uniforms.emission_strength + 
                          uniforms.beat_intensity * 0.5 + 
                          abs(emission_pattern) * 0.3;
  
  let emission_color = base_color * emission_intensity;
  final_color += emission_color;
  
  // Procedural surface details
  let detail_noise = noise(input.world_position * 8.0 + uniforms.time * 0.5);
  final_color += vec3<f32>(detail_noise * 0.1);
  
  return vec4<f32>(final_color, 1.0);
}