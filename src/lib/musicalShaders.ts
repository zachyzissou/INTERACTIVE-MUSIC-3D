import { ObjectType } from '../store/useObjects'

// Maps musical concepts to shader parameters
export interface MusicalShaderParams {
  // Core musical properties
  noteType: ObjectType
  frequency: number
  amplitude: number
  harmonicContent: number[]
  
  // Musical effects that drive visuals
  reverb: number        // 0-1, affects glow/blur
  delay: number         // 0-1, affects echo/trail effects  
  distortion: number    // 0-1, affects geometric distortion
  chorus: number        // 0-1, affects shimmer/phase
  filter: number        // 0-1, affects color saturation
  
  // Chord properties
  chordType?: 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | '7th'
  chordInversion?: number
  chordComplexity?: number // 0-1, more complex = more visual elements
  
  // Rhythm properties  
  beatPattern?: number[] // For beat objects
  swing?: number        // 0-1, affects timing distortion
  polyrhythm?: number   // Multiple rhythmic layers
  
  // Loop properties
  loopLength?: number   // In beats
  layerCount?: number   // How many sounds are layered
  evolution?: number    // 0-1, how much the loop changes over time
}

// Shader configurations for different sound types
export const musicalShaderConfigs = {
  note: {
    baseShape: 'sphere',
    fragmentShader: `
      uniform float uFrequency;
      uniform float uAmplitude;
      uniform float uReverb;
      uniform float uDistortion;
      uniform vec3 uColor;
      uniform float uTime;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vec2 uv = vUv;
        
        // Frequency affects the base pattern
        float freq = uFrequency * 0.01;
        float pattern = sin(uv.x * freq + uTime) * sin(uv.y * freq + uTime);
        
        // Amplitude affects intensity
        float intensity = uAmplitude * 0.5;
        
        // Reverb creates a soft glow
        float glow = 1.0 + uReverb * 0.5;
        
        // Distortion warps the UV coordinates
        vec2 distortedUv = uv + sin(uv * 10.0 + uTime) * uDistortion * 0.1;
        
        vec3 color = uColor * intensity * glow;
        color += pattern * 0.3;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `,
    uniforms: ['uFrequency', 'uAmplitude', 'uReverb', 'uDistortion']
  },
  
  chord: {
    baseShape: 'complex',
    fragmentShader: `
      uniform float uChordComplexity;
      uniform float uChorus;
      uniform float uFilter;
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uHarmonic1;
      uniform float uHarmonic2;
      uniform float uHarmonic3;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        
        // Multiple harmonic layers for chord complexity
        float h1 = sin(uv.x * 8.0 + uTime + uHarmonic1) * 0.3;
        float h2 = sin(uv.x * 12.0 + uTime * 1.2 + uHarmonic2) * 0.2;
        float h3 = sin(uv.x * 16.0 + uTime * 0.8 + uHarmonic3) * 0.1;
        
        float harmonics = h1 + h2 + h3;
        harmonics *= uChordComplexity;
        
        // Chorus effect creates shimmer
        float shimmer = sin(uTime * 5.0 + uv.y * 20.0) * uChorus * 0.2;
        
        // Filter affects saturation
        vec3 color = mix(vec3(0.5), uColor, uFilter);
        color += harmonics;
        color += shimmer;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `,
    uniforms: ['uChordComplexity', 'uChorus', 'uFilter', 'uHarmonic1', 'uHarmonic2', 'uHarmonic3']
  },
  
  beat: {
    baseShape: 'cube',
    fragmentShader: `
      uniform float uSwing;
      uniform float uPolyrhythm;
      uniform float uAmplitude;
      uniform vec3 uColor;
      uniform float uTime;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        
        // Rhythmic patterns
        float beat1 = step(0.5, sin(uTime * 4.0));
        float beat2 = step(0.3, sin(uTime * 6.0 + uSwing));
        float poly = sin(uTime * uPolyrhythm * 2.0) * 0.5 + 0.5;
        
        float rhythm = beat1 * 0.6 + beat2 * 0.3 + poly * 0.1;
        rhythm *= uAmplitude;
        
        // Sharp, geometric patterns for beats
        float grid = step(0.9, sin(uv.x * 10.0)) + step(0.9, sin(uv.y * 10.0));
        
        vec3 color = uColor * rhythm;
        color += grid * 0.2;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `,
    uniforms: ['uSwing', 'uPolyrhythm', 'uAmplitude']
  },
  
  loop: {
    baseShape: 'torus',
    fragmentShader: `
      uniform float uEvolution;
      uniform float uLayerCount;
      uniform float uLoopLength;
      uniform float uDelay;
      uniform vec3 uColor;
      uniform float uTime;
      
      varying vec2 vUv;
      
      void main() {
        vec2 uv = vUv;
        
        // Evolving patterns over time
        float evolution = sin(uTime * 0.5) * uEvolution;
        
        // Multiple layers for loop complexity
        float layer1 = sin(uv.x * 5.0 + uTime + evolution);
        float layer2 = sin(uv.y * 7.0 + uTime * 1.3 + evolution * 0.5);
        float layer3 = sin((uv.x + uv.y) * 9.0 + uTime * 0.7 + evolution * 2.0);
        
        float layers = (layer1 + layer2 + layer3) / 3.0;
        layers *= uLayerCount * 0.2;
        
        // Delay creates trailing effects
        float trail = sin(uTime * 3.0 + length(uv - 0.5) * 10.0) * uDelay;
        
        vec3 color = uColor + layers * 0.4 + trail * 0.2;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `,
    uniforms: ['uEvolution', 'uLayerCount', 'uLoopLength', 'uDelay']
  }
}

// Convert musical properties to shader uniforms
export function getShaderUniforms(params: MusicalShaderParams): Record<string, number> {
  const uniforms: Record<string, number> = {}
  
  // Common uniforms for all types
  uniforms.uTime = Date.now() * 0.001
  uniforms.uAmplitude = params.amplitude
  
  // Type-specific uniforms
  switch (params.noteType) {
    case 'note':
      uniforms.uFrequency = params.frequency
      uniforms.uReverb = params.reverb
      uniforms.uDistortion = params.distortion
      break
      
    case 'chord':
      uniforms.uChordComplexity = params.chordComplexity || 0.5
      uniforms.uChorus = params.chorus
      uniforms.uFilter = params.filter
      uniforms.uHarmonic1 = params.harmonicContent[0] || 0
      uniforms.uHarmonic2 = params.harmonicContent[1] || 0
      uniforms.uHarmonic3 = params.harmonicContent[2] || 0
      break
      
    case 'beat':
      uniforms.uSwing = params.swing || 0
      uniforms.uPolyrhythm = params.polyrhythm || 1
      break
      
    case 'loop':
      uniforms.uEvolution = params.evolution || 0.5
      uniforms.uLayerCount = params.layerCount || 1
      uniforms.uLoopLength = params.loopLength || 4
      uniforms.uDelay = params.delay
      break
  }
  
  return uniforms
}

// Map chord types to visual complexity
export const chordComplexityMap = {
  'major': 0.3,
  'minor': 0.4,
  'diminished': 0.7,
  'augmented': 0.8,
  'sus2': 0.5,
  'sus4': 0.5,
  '7th': 0.9
}

// Map scales to color palettes
export const scaleColorMap = {
  'major': { hue: 60, saturation: 80, lightness: 60 },    // Bright yellow-orange
  'minor': { hue: 240, saturation: 70, lightness: 50 },   // Deep blue
  'dorian': { hue: 300, saturation: 60, lightness: 55 },  // Purple
  'mixolydian': { hue: 30, saturation: 85, lightness: 65 }, // Orange
  'pentatonic': { hue: 120, saturation: 70, lightness: 55 }, // Green
  'blues': { hue: 200, saturation: 80, lightness: 45 }    // Deep cyan
}