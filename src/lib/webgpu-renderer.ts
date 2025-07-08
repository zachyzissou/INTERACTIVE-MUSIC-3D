// src/lib/webgpu-renderer.ts
/**
 * WebGPU Renderer Implementation
 * Next-generation GPU rendering for enhanced performance
 */

import { logger } from './logger'

// WebGPU type declarations (until @webgpu/types is available)
declare global {
  interface Navigator {
    gpu?: {
      requestAdapter(options?: any): Promise<any>
      getPreferredCanvasFormat(): string
    }
  }
  
  interface HTMLCanvasElement {
    getContext(contextId: 'webgpu'): any
  }
}

export interface WebGPUCapabilities {
  supported: boolean
  adapter: any
  device: any
  features: string[]
  limits: Record<string, number>
}

export class WebGPURenderer {
  private device: any = null
  private adapter: any = null
  private context: any = null
  private capabilities: WebGPUCapabilities = {
    supported: false,
    adapter: null,
    device: null,
    features: [],
    limits: {}
  }

  // WGSL Shader Sources
  private metaballVertexShader = `
    @vertex
    fn vs_main(@builtin(vertex_index) vertexIndex : u32) -> @builtin(position) vec4<f32> {
        let pos = array<vec2<f32>, 3>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>( 3.0, -1.0),
            vec2<f32>(-1.0,  3.0)
        );
        return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
    }
  `

  private metaballFragmentShader = `
    struct Uniforms {
        time: f32,
        resolution: vec2<f32>,
        bassSensitivity: f32,
        audioData: array<f32, 32>,
    }
    
    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
    
    fn metaball(uv: vec2<f32>, center: vec2<f32>, radius: f32) -> f32 {
        let dist = length(uv - center);
        return smoothstep(radius, radius - 0.02, dist);
    }
    
    fn smin(a: f32, b: f32, k: f32) -> f32 {
        let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
    }
    
    @fragment
    fn fs_main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
        var uv = (fragCoord.xy / uniforms.resolution.xy) * 2.0 - 1.0;
        uv.x *= uniforms.resolution.x / uniforms.resolution.y;
        
        // Audio-reactive parameters
        let bassEnergy = uniforms.audioData[4] * uniforms.bassSensitivity;
        let midEnergy = uniforms.audioData[16];
        
        // Animated metaball centers
        let center1 = vec2<f32>(sin(uniforms.time * 0.5) * 0.3, cos(uniforms.time * 0.7) * 0.2);
        let center2 = vec2<f32>(cos(uniforms.time * 0.3) * 0.4, sin(uniforms.time * 0.6) * 0.3);
        let center3 = vec2<f32>(sin(uniforms.time * 0.8) * 0.2, cos(uniforms.time * 0.4) * 0.35);
        
        // Audio-reactive sizes
        let radius1 = 0.15 + bassEnergy * 0.1;
        let radius2 = 0.12 + midEnergy * 0.08;
        let radius3 = 0.18 + bassEnergy * 0.05;
        
        // Calculate metaballs
        let m1 = metaball(uv, center1, radius1);
        let m2 = metaball(uv, center2, radius2);
        let m3 = metaball(uv, center3, radius3);
        
        // Smooth union for organic blending
        let combined = smin(smin(m1, m2, 0.1), m3, 0.1);
        
        // Color gradient based on audio
        let color1 = vec3<f32>(1.0, 0.0, 1.0); // Magenta
        let color2 = vec3<f32>(0.0, 1.0, 1.0); // Cyan
        let color3 = vec3<f32>(1.0, 1.0, 0.0); // Yellow
        
        var finalColor = mix(color1, color2, sin(uniforms.time + bassEnergy) * 0.5 + 0.5);
        finalColor = mix(finalColor, color3, midEnergy);
        
        // Add glow effect
        let glow = exp(-length(uv) * 2.0) * bassEnergy;
        finalColor += glow * vec3<f32>(1.0, 0.5, 1.0);
        
        return vec4<f32>(finalColor * combined, combined);
    }
  `

  private renderPipeline: any = null
  private uniformBuffer: any = null
  private bindGroup: any = null

  async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.warn('WebGPU not supported in this browser')
        return false
      }

      // Request adapter
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      })

      if (!this.adapter) {
        console.warn('WebGPU adapter not available')
        return false
      }

      // Request device
      this.device = await this.adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {}
      })

      if (!this.device) {
        console.warn('WebGPU device not available')
        return false
      }

      // Set up canvas context
      this.context = canvas.getContext('webgpu')
      if (!this.context) {
        console.warn('WebGPU canvas context not available')
        return false
      }

      // Configure canvas
      this.context.configure({
        device: this.device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        alphaMode: 'premultiplied'
      })

      // Update capabilities
      this.capabilities = {
        supported: true,
        adapter: this.adapter,
        device: this.device,
        features: Array.from(this.adapter.features || []),
        limits: this.adapter.limits ? 
          Object.fromEntries(
            Object.entries(this.adapter.limits).map(([key, value]) => [key, Number(value)])
          ) : {}
      }

      logger.info(`WebGPU renderer initialized successfully: ${JSON.stringify(this.capabilities)}`)
      return true

    } catch (error) {
      console.error('WebGPU initialization failed:', error)
      return false
    }
  }

  getCapabilities(): WebGPUCapabilities {
    return { ...this.capabilities }
  }

  createShaderModule(code: string): any {
    return this.executeWithDevice(
      () => this.device.createShaderModule({
        code,
        label: 'Custom Shader Module'
      }),
      'Failed to create shader module:'
    );
  }

  createRenderPipeline(descriptor: any): any {
    return this.executeWithDevice(
      () => this.device.createRenderPipeline(descriptor),
      'Failed to create render pipeline:'
    );
  }

  createBuffer(descriptor: any): any {
    return this.executeWithDevice(
      () => this.device.createBuffer(descriptor),
      'Failed to create buffer:'
    );
  }

  createTexture(descriptor: any): any {
    if (!this.device) return null

    try {
      return this.device.createTexture(descriptor)
    } catch (error) {
      console.error('Failed to create texture:', error)
      return null
    }
  }

  beginRenderPass(encoder: any, descriptor: any): any {
    try {
      return encoder.beginRenderPass(descriptor)
    } catch (error) {
      console.error('Failed to begin render pass:', error)
      return null
    }
  }

  render(renderFunction: (device: any, context: any) => void): boolean {
    if (!this.device || !this.context) return false

    try {
      renderFunction(this.device, this.context)
      return true
    } catch (error) {
      console.error('WebGPU render error:', error)
      return false
    }
  }

  private executeWithDevice<T>(fn: () => T, errorMessage: string): T | null {
    if (!this.device) return null

    try {
      return fn()
    } catch (error) {
      console.error(errorMessage, error)
      return null
    }
  }

  dispose(): void {
    if (this.device) {
      this.device.destroy?.()
      this.device = null
    }
    this.adapter = null
    this.context = null
    this.capabilities = {
      supported: false,
      adapter: null,
      device: null,
      features: [],
      limits: {}
    }
  }

  // Utility methods
  static async isSupported(): Promise<boolean> {
    if (!navigator.gpu) return false
    
    try {
      const adapter = await navigator.gpu.requestAdapter()
      return !!adapter
    } catch {
      return false
    }
  }

  static getPreferredFormat(): string {
    return navigator.gpu?.getPreferredCanvasFormat?.() || 'bgra8unorm'
  }
}

// Audio-reactive compute shader for WebGPU
export const audioReactiveComputeShader = /* wgsl */ `
struct AudioData {
  bass: f32,
  mid: f32,
  treble: f32,
  time: f32,
}

struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  color: vec3<f32>,
  life: f32,
}

@group(0) @binding(0) var<uniform> audioData: AudioData;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;
  if (index >= arrayLength(&particles)) {
    return;
  }

  let audioLevel = (audioData.bass + audioData.mid + audioData.treble) / 3.0;
  let audioReactivity = audioLevel * 0.01;

  var particle = particles[index];
  
  // Audio-reactive movement
  particle.velocity.y += audioData.bass * 0.001;
  particle.velocity.x += sin(audioData.time + f32(index)) * audioReactivity;
  particle.velocity.z += cos(audioData.time + f32(index)) * audioReactivity;
  
  // Update position
  particle.position += particle.velocity;
  
  // Audio-reactive color
  particle.color.r = audioData.treble / 255.0;
  particle.color.g = audioData.mid / 255.0;
  particle.color.b = audioData.bass / 255.0;
  
  // Update life
  particle.life -= 0.01;
  if (particle.life <= 0.0) {
    particle.life = 1.0;
    particle.position = vec3<f32>(0.0, 0.0, 0.0);
  }
  
  particles[index] = particle;
}
`

// Vertex shader for audio-reactive rendering
export const audioReactiveVertexShader = /* wgsl */ `
struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) color: vec3<f32>,
}

struct VertexOutput {
  @builtin(position) clip_position: vec4<f32>,
  @location(0) color: vec3<f32>,
}

struct Uniforms {
  view_proj: mat4x4<f32>,
  time: f32,
  audio_level: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  
  // Audio-reactive vertex displacement
  let displacement = sin(uniforms.time + input.position.x) * uniforms.audio_level * 0.1;
  let displaced_position = input.position + vec3<f32>(0.0, displacement, 0.0);
  
  out.clip_position = uniforms.view_proj * vec4<f32>(displaced_position, 1.0);
  out.color = input.color;
  
  return out;
}
`

// Fragment shader
export const audioReactiveFragmentShader = /* wgsl */ `
@fragment
fn fs_main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(color, 1.0);
}
`

export default WebGPURenderer
