// RGB Split Glitch Fragment Shader - GLSL Version
#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform float uGlitchIntensity;
uniform float uAudioData[32];
uniform float uDigitalNoise;

in vec2 vUv;
out vec4 fragColor;

// Random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Digital corruption patterns
float digitalNoise(vec2 uv, float time) {
    // Horizontal scan lines
    float scanlines = sin(uv.y * uResolution.y * 2.0) * 0.04;
    
    // Vertical glitch bars
    float bars = step(0.95, random(vec2(floor(uv.y * 20.0), floor(time * 10.0))));
    
    // Random pixel corruption
    float pixelNoise = random(floor(uv * uResolution.xy / 4.0) + floor(time * 60.0)) * 0.1;
    
    return scanlines + bars * 0.3 + pixelNoise;
}

void main() {
    vec2 uv = vUv;
    
    // Audio reactivity
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Time with audio modulation
    float time = uTime + bassEnergy * 5.0;
    
    // Glitch intensity modulation
    float glitchMod = uGlitchIntensity * (0.5 + bassEnergy * 0.5 + highEnergy * 0.3);
    
    // RGB channel offsets
    vec2 offsetR = vec2(glitchMod * 0.01 * sin(time * 10.0), 0.0);
    vec2 offsetG = vec2(0.0, glitchMod * 0.01 * cos(time * 15.0));
    vec2 offsetB = vec2(-glitchMod * 0.01 * sin(time * 8.0), 0.0);
    
    // Horizontal displacement
    float horizontalShift = glitchMod * 0.05 * 
                          step(0.98, random(vec2(floor(uv.y * 50.0), floor(time * 20.0)))) *
                          sin(time * 50.0);
    
    // Vertical jitter
    float verticalJitter = glitchMod * 0.02 * 
                          random(vec2(floor(time * 100.0), floor(uv.x * 10.0))) *
                          midEnergy;
    
    // Apply displacements
    vec2 uvR = uv + offsetR + vec2(horizontalShift, verticalJitter);
    vec2 uvG = uv + offsetG + vec2(horizontalShift * 0.5, verticalJitter * 0.5);
    vec2 uvB = uv + offsetB + vec2(horizontalShift * -0.5, verticalJitter * -0.5);
    
    // Sample RGB channels separately
    float r = texture(uTexture, uvR).r;
    float g = texture(uTexture, uvG).g;
    float b = texture(uTexture, uvB).b;
    
    vec3 glitchedColor = vec3(r, g, b);
    
    // Digital corruption
    float corruption = digitalNoise(uv, time) * uDigitalNoise * glitchMod;
    
    // Add digital artifacts
    if (corruption > 0.1) {
        // Random color corruption
        vec3 corruptColor = vec3(
            random(uv + time),
            random(uv + time + 1.0),
            random(uv + time + 2.0)
        );
        glitchedColor = mix(glitchedColor, corruptColor, corruption * 0.3);
    }
    
    // Datamoshing effect
    float datamosh = step(0.99, random(uv + floor(time * 30.0))) * glitchMod;
    if (datamosh > 0.0) {
        // Sample from random nearby location
        vec2 moshUV = uv + vec2(
            random(uv + time) - 0.5,
            random(uv + time + 10.0) - 0.5
        ) * 0.1 * glitchMod;
        
        vec3 moshColor = texture(uTexture, moshUV).rgb;
        glitchedColor = mix(glitchedColor, moshColor, 0.5);
    }
    
    // Color quantization for digital effect
    float quantizationLevels = 8.0 - glitchMod * 4.0;
    glitchedColor = floor(glitchedColor * quantizationLevels) / quantizationLevels;
    
    // Chromatic aberration enhancement
    float aberration = glitchMod * (0.3 + bassEnergy * 0.4);
    glitchedColor.r *= 1.0 + aberration;
    glitchedColor.b *= 1.0 - aberration * 0.5;
    
    // Add noise overlay
    float noiseOverlay = noise(uv * 100.0 + time * 10.0) * 0.1 * glitchMod;
    glitchedColor += vec3(noiseOverlay);
    
    // Audio-reactive color shifts
    glitchedColor.r += sin(time + bassEnergy * 10.0) * 0.1 * glitchMod;
    glitchedColor.g += cos(time + midEnergy * 8.0) * 0.1 * glitchMod;
    glitchedColor.b += sin(time + highEnergy * 12.0) * 0.1 * glitchMod;
    
    // Clamp values
    glitchedColor = clamp(glitchedColor, 0.0, 1.0);
    
    fragColor = vec4(glitchedColor, 1.0);
}