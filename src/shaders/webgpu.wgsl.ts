// WebGPU WGSL Shaders for advanced visual effects
export const webgpuMetaballShader = /* wgsl */ `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct Uniforms {
    time: f32,
    bass_lev            // WebGPU initialization successful
            return true;
        } catch (error) {
            console.error('WebGPU initialization failed:', error);
            return false;
        }2,
    mid_level: f32,
    high_level: f32,
    resolution: vec2<f32>,
    metaball_count: f32,
    glow_intensity: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let a = dot(i, vec2(12.9898, 78.233));
    let b = dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233));
    let c = dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233));
    let d = dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233));
    let u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(fract(sin(a) * 43758.5453), fract(sin(b) * 43758.5453), u.x),
        mix(fract(sin(c) * 43758.5453), fract(sin(d) * 43758.5453), u.x),
        u.y
    );
}

fn metaball(uv: vec2<f32>, center: vec2<f32>, radius: f32, audio_level: f32) -> f32 {
    let pos = center + vec2(
        noise(center * 3.0 + uniforms.time * 0.5) * 0.2 * audio_level,
        noise(center * 2.0 + uniforms.time * 0.3) * 0.15 * audio_level
    );
    let dist = length(uv - pos);
    let organic_radius = radius * (1.0 + audio_level * 0.3 + noise(uv * 8.0 + uniforms.time) * 0.1);
    return organic_radius / (dist + 0.001);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    let uv = input.uv;
    let center = uv - 0.5;
    
    var field = 0.0;
    
    // Primary metaball (bass-reactive)
    field += metaball(uv, vec2(0.5 + sin(uniforms.time * 0.5) * 0.3, 0.5), 
                     0.15 + uniforms.bass_level * 0.1, uniforms.bass_level);
    
    // Secondary metaballs (mid/high frequency reactive)
    field += metaball(uv, vec2(0.3 + cos(uniforms.time * 0.8) * 0.2, 0.7), 
                     0.1 + uniforms.mid_level * 0.08, uniforms.mid_level);
                     
    field += metaball(uv, vec2(0.7 + sin(uniforms.time * 1.2) * 0.25, 0.3), 
                     0.08 + uniforms.high_level * 0.06, uniforms.high_level);
    
    // Additional dynamic metaballs
    for (var i = 0.0; i < uniforms.metaball_count; i += 1.0) {
        let angle = i * 6.28318 / uniforms.metaball_count + uniforms.time * 0.3;
        let pos = vec2(cos(angle), sin(angle)) * 0.3 + vec2(0.5);
        field += metaball(uv, pos, 0.05, (uniforms.bass_level + uniforms.mid_level) * 0.5);
    }
    
    // Color mixing with audio reactivity
    let color1 = vec3(0.2, 0.8, 1.0) * (1.0 + uniforms.bass_level);
    let color2 = vec3(1.0, 0.3, 0.8) * (1.0 + uniforms.high_level);
    
    let intensity = smoothstep(0.5, 1.5, field);
    var final_color = mix(color1, color2, intensity);
    
    // Neon glow effect
    let glow = exp(-length(center) * (2.0 - uniforms.glow_intensity));
    final_color += vec3(0.0, 0.8, 1.0) * glow * uniforms.mid_level * 0.5;
    
    // Audio-reactive edge enhancement
    let edge = fwidth(field) * 10.0;
    final_color += vec3(1.0, 0.2, 0.8) * edge * uniforms.high_level;
    
    return vec4(final_color, intensity);
}
`;

export const webgpuComputeShader = /* wgsl */ `
struct AudioData {
    bass: f32,
    mid: f32,
    high: f32,
    volume: f32,
    spectrum: array<f32, 16>,
}

struct ParticleData {
    position: vec2<f32>,
    velocity: vec2<f32>,
    life: f32,
    size: f32,
}

@group(0) @binding(0) var<storage, read_write> particles: array<ParticleData>;
@group(0) @binding(1) var<uniform> audio_data: AudioData;
@group(0) @binding(2) var<uniform> time: f32;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    if (index >= arrayLength(&particles)) {
        return;
    }
    
    var particle = particles[index];
    
    // Update particle based on audio
    let audio_force = vec2(
        sin(time + f32(index) * 0.1) * audio_data.bass * 0.01,
        cos(time + f32(index) * 0.15) * audio_data.mid * 0.01
    );
    
    particle.velocity += audio_force;
    particle.velocity *= 0.98; // Damping
    particle.position += particle.velocity;
    
    // Bounce off edges
    if (particle.position.x < 0.0 || particle.position.x > 1.0) {
        particle.velocity.x *= -0.8;
        particle.position.x = clamp(particle.position.x, 0.0, 1.0);
    }
    if (particle.position.y < 0.0 || particle.position.y > 1.0) {
        particle.velocity.y *= -0.8;
        particle.position.y = clamp(particle.position.y, 0.0, 1.0);
    }
    
    // Update size based on audio
    particle.size = 0.005 + audio_data.spectrum[index % 16] * 0.02;
    
    particles[index] = particle;
}
`;

export const webgpuVertexShader = /* wgsl */ `
struct VertexInput {
    @location(0) position: vec2<f32>,
    @location(1) uv: vec2<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4(input.position, 0.0, 1.0);
    output.uv = input.uv;
    return output;
}
`;

// WebGPU type definitions for TypeScript
// Only declare these if they don't already exist in the global namespace
declare global {
    // Use a more specific type to avoid conflicts
    interface WebGPUNavigator extends Navigator {
        readonly gpu?: {
            requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
            getPreferredCanvasFormat(): GPUTextureFormat;
        };
    }
    
    interface GPUAdapter {
        requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
    }
    
    interface GPUDevice {
        createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
        createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
        createCommandEncoder(): GPUCommandEncoder;
        queue: GPUQueue;
    }
    
    interface GPUCanvasContext {
        configure(configuration: GPUCanvasConfiguration): void;
        getCurrentTexture(): GPUTexture;
    }
    
    type GPUTextureFormat = string;
    type GPURenderPipeline = any;
    type GPUShaderModule = any;
    type GPUCommandEncoder = any;
    type GPUQueue = any;
    type GPUTexture = any;
    type GPURequestAdapterOptions = any;
    type GPUDeviceDescriptor = any;
    type GPUShaderModuleDescriptor = any;
    type GPURenderPipelineDescriptor = any;
    type GPUCanvasConfiguration = any;
}

// WebGPU Utility Functions
export class WebGPUShaderManager {
    private device: GPUDevice | null = null;
    private context: GPUCanvasContext | null = null;
    private pipeline: GPURenderPipeline | null = null;

    async initialize(canvas: HTMLCanvasElement): Promise<boolean> {
        try {
            // Check for WebGPU support
            if (!navigator.gpu) {
                console.warn('WebGPU not supported, falling back to WebGL');
                return false;
            }

            // Request adapter and device
            const adapter = await navigator.gpu.requestAdapter({
                powerPreference: 'high-performance'
            });
            
            if (!adapter) {
                console.warn('WebGPU adapter not available');
                return false;
            }

            this.device = await adapter.requestDevice();
            this.context = canvas.getContext('webgpu') as GPUCanvasContext;

            if (!this.context) {
                console.warn('WebGPU context not available');
                return false;
            }

            // Configure the context
            const format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: format,
                alphaMode: 'premultiplied',
            });

            this.createPipeline(format);
            
            // WebGPU initialized successfully
            return true;
        } catch (error) {
            console.warn('WebGPU initialization failed:', error);
            return false;
        }
    }

    private createPipeline(format: GPUTextureFormat) {
        if (!this.device) return;

        const shaderModule = this.device.createShaderModule({
            code: webgpuVertexShader + webgpuMetaballShader
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 4 * 4, // 4 floats per vertex
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' }, // position
                        { shaderLocation: 1, offset: 2 * 4, format: 'float32x2' }, // uv
                    ]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{ format }]
            },
            primitive: {
                topology: 'triangle-strip',
            },
        });
    }

    render(audioData: any) {
        if (!this.device || !this.context || !this.pipeline) return;

        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }]
        });

        renderPass.setPipeline(this.pipeline);
        // Set uniforms and draw
        renderPass.draw(4); // Full-screen quad
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}

// Define the WebGPU exports
const webgpuExports = {
    webgpuMetaballShader,
    webgpuComputeShader,
    webgpuVertexShader,
    WebGPUShaderManager
};

export default webgpuExports;
