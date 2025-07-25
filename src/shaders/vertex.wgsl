struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

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

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> uniforms: Uniforms;
@group(0) @binding(2) var<uniform> model_matrix: mat4x4<f32>;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  
  // Apply procedural vertex displacement based on audio
  var displaced_pos = input.position;
  
  // Audio-reactive displacement
  let noise_freq = 2.0 + uniforms.bass * 0.02;
  let displacement = sin(input.position.x * noise_freq + uniforms.time) * 
                   cos(input.position.y * noise_freq + uniforms.time * 0.7) * 
                   sin(input.position.z * noise_freq + uniforms.time * 1.3);
  
  let audio_displacement = displacement * uniforms.audio_level * 0.15;
  displaced_pos += input.normal * audio_displacement;
  
  // Beat-reactive pulsing
  let beat_scale = 1.0 + uniforms.beat_intensity * 0.08;
  displaced_pos *= beat_scale;
  
  let world_position = model_matrix * vec4<f32>(displaced_pos, 1.0);
  
  output.clip_position = camera.view_proj * world_position;
  output.world_position = world_position.xyz;
  output.world_normal = normalize((model_matrix * vec4<f32>(input.normal, 0.0)).xyz);
  output.uv = input.uv;
  output.view_position = (camera.view * world_position).xyz;
  
  return output;
}