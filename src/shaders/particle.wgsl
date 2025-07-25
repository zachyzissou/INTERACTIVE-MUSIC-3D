struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  color: vec3<f32>,
  life: f32,
  size: f32,
  _padding: vec3<f32>,
}

struct ParticleUniforms {
  time: f32,
  delta_time: f32,
  audio_level: f32,
  bass: f32,
  mid: f32,
  treble: f32,
  beat_intensity: f32,
  spawn_rate: f32,
  particle_count: u32,
  _padding: vec3<f32>,
}

struct Camera {
  view_proj: mat4x4<f32>,
  view: mat4x4<f32>,
  projection: mat4x4<f32>,
  position: vec3<f32>,
  _padding: f32,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> uniforms: ParticleUniforms;
@group(0) @binding(2) var<storage, read_write> particles: array<Particle>;

// Compute shader for particle simulation
@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= uniforms.particle_count) { return; }
  
  var particle = particles[index];
  
  // Update particle life
  particle.life -= uniforms.delta_time;
  
  // Reset dead particles
  if (particle.life <= 0.0) {
    // Spawn new particle with audio-reactive properties
    let spawn_radius = 5.0 + uniforms.bass * 0.02;
    let angle = f32(index) * 0.1 + uniforms.time;
    
    particle.position = vec3<f32>(
      cos(angle) * spawn_radius,
      sin(uniforms.time * 2.0 + f32(index)) * 2.0,
      sin(angle) * spawn_radius
    );
    
    // Audio-reactive velocity
    let velocity_scale = 1.0 + uniforms.audio_level * 0.01;
    particle.velocity = vec3<f32>(
      (cos(angle + 1.57) * velocity_scale),
      (1.0 + uniforms.treble * 0.005),
      (sin(angle + 1.57) * velocity_scale)
    ) * 2.0;
    
    // Beat-reactive color
    let hue = fract(f32(index) * 0.1 + uniforms.time * 0.1 + uniforms.beat_intensity);
    particle.color = vec3<f32>(
      0.5 + 0.5 * cos(6.28318 * (hue + 0.0)),
      0.5 + 0.5 * cos(6.28318 * (hue + 0.33)),
      0.5 + 0.5 * cos(6.28318 * (hue + 0.67))
    );
    
    particle.life = 3.0 + uniforms.mid * 0.01;
    particle.size = 0.1 + uniforms.bass * 0.001;
  }
  
  // Update particle physics
  particle.position += particle.velocity * uniforms.delta_time;
  
  // Audio-reactive forces
  let audio_force = vec3<f32>(
    sin(uniforms.time + particle.position.x * 0.1) * uniforms.bass * 0.001,
    cos(uniforms.time * 1.3 + particle.position.z * 0.1) * uniforms.mid * 0.001,
    sin(uniforms.time * 0.7 + particle.position.y * 0.1) * uniforms.treble * 0.001
  );
  
  particle.velocity += audio_force * uniforms.delta_time;
  
  // Gravity and damping
  particle.velocity.y -= 9.81 * uniforms.delta_time * 0.1;
  particle.velocity *= 0.995;
  
  // Size pulsing based on beat
  particle.size = (0.1 + uniforms.bass * 0.001) * (1.0 + uniforms.beat_intensity * 0.5);
  
  particles[index] = particle;
}

// Vertex shader for particle rendering
struct ParticleVertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) color: vec3<f32>,
  @location(1) life: f32,
  @location(2) uv: vec2<f32>,
}

@vertex
fn vs_particle(@builtin(vertex_index) vertex_index: u32, @builtin(instance_index) instance_index: u32) -> ParticleVertexOutput {
  let particle = particles[instance_index];
  
  // Quad vertices in local space
  var quad_positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 1.0, -1.0),
    vec2<f32>( 1.0,  1.0),
    vec2<f32>(-1.0,  1.0)
  );
  
  var quad_uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 0.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(0.0, 1.0),
    vec2<f32>(1.0, 0.0),
    vec2<f32>(1.0, 1.0),
    vec2<f32>(0.0, 1.0)
  );
  
  let quad_pos = quad_positions[vertex_index];
  let uv = quad_uvs[vertex_index];
  
  // Billboard the particle to face the camera
  let to_camera = normalize(camera.position - particle.position);
  let right = normalize(cross(vec3<f32>(0.0, 1.0, 0.0), to_camera));
  let up = cross(to_camera, right);
  
  let world_position = particle.position + 
    (right * quad_pos.x + up * quad_pos.y) * particle.size;
  
  var output: ParticleVertexOutput;
  output.clip_position = camera.view_proj * vec4<f32>(world_position, 1.0);
  output.color = particle.color;
  output.life = particle.life;
  output.uv = uv;
  
  return output;
}

// Fragment shader for particle rendering
@fragment
fn fs_particle(input: ParticleVertexOutput) -> @location(0) vec4<f32> {
  // Circular particle shape
  let dist = length(input.uv - vec2<f32>(0.5));
  if (dist > 0.5) { discard; }
  
  // Soft edges
  let alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  
  // Life-based fading
  let life_alpha = clamp(input.life / 1.0, 0.0, 1.0);
  
  // Glow effect
  let glow = exp(-dist * 4.0);
  let final_color = input.color * (1.0 + glow * 0.5);
  
  return vec4<f32>(final_color, alpha * life_alpha * 0.8);
}