// Water Ripple Fragment Shader - GLSL Version  
#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uAudioData[32];
uniform float uRippleIntensity;
uniform float uWaveSpeed;

in vec2 vUv;
out vec4 fragColor;

// Generate a single ripple
float ripple(vec2 uv, vec2 center, float time, float frequency, float amplitude, float decay) {
    float dist = length(uv - center);
    float wave = sin(dist * frequency - time * uWaveSpeed) * amplitude;
    return wave * exp(-dist * decay);
}

// Multiple ripple sources
float multiRipple(vec2 uv, float time) {
    float ripples = 0.0;
    
    // Audio-driven parameters
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Center ripple (bass-driven)
    ripples += ripple(uv, vec2(0.5), time, 
                     20.0 + bassEnergy * 30.0, 
                     0.15 + bassEnergy * 0.25, 
                     2.0);
    
    // Mouse/interaction ripple
    ripples += ripple(uv, uMouse, time, 
                     15.0, 
                     0.12 * uRippleIntensity, 
                     2.5);
    
    // Corner ripples (audio-reactive)
    ripples += ripple(uv, vec2(0.2, 0.8), time + midEnergy * 2.0, 
                     25.0 + midEnergy * 20.0, 
                     0.08 + midEnergy * 0.15, 
                     3.0);
                     
    ripples += ripple(uv, vec2(0.8, 0.2), time + highEnergy * 1.5, 
                     30.0 + highEnergy * 25.0, 
                     0.06 + highEnergy * 0.12, 
                     3.5);
    
    // Random ripples for more dynamic effect
    ripples += ripple(uv, vec2(0.3, 0.3), time * 0.7, 
                     18.0, 
                     0.05 + bassEnergy * 0.08, 
                     4.0);
                     
    ripples += ripple(uv, vec2(0.7, 0.7), time * 0.9, 
                     22.0, 
                     0.04 + midEnergy * 0.06, 
                     4.5);
    
    return ripples;
}

// Water caustics effect
float caustics(vec2 uv, float time) {
    vec2 p = uv * 10.0;
    float c1 = sin(p.x + time) * sin(p.y + time * 0.7);
    float c2 = sin(p.x * 1.3 + time * 0.8) * sin(p.y * 1.7 + time * 0.5);
    return (c1 + c2) * 0.5;
}

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    
    // Audio parameters
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Calculate ripples
    float ripples = multiRipple(uv, uTime);
    
    // Distort UV coordinates based on ripples
    vec2 distortedUV = uv + ripples * 0.1 * uRippleIntensity;
    
    // Water depth gradient
    float depth = length(center) * 2.0;
    depth = 1.0 - smoothstep(0.0, 1.0, depth);
    
    // Base water colors
    vec3 deepWater = vec3(0.0, 0.1, 0.4);
    vec3 shallowWater = vec3(0.0, 0.4, 0.8);
    vec3 surfaceWater = vec3(0.3, 0.7, 1.0);
    vec3 foam = vec3(0.9, 0.95, 1.0);
    
    // Mix colors based on depth
    vec3 waterColor = mix(deepWater, shallowWater, depth);
    waterColor = mix(waterColor, surfaceWater, depth * depth);
    
    // Add foam where ripples are strongest
    float foamThreshold = 0.08 + bassEnergy * 0.05;
    float foamMask = smoothstep(foamThreshold, foamThreshold + 0.02, abs(ripples));
    waterColor = mix(waterColor, foam, foamMask * (0.5 + bassEnergy * 0.5));
    
    // Caustics effect
    float causticsPattern = caustics(distortedUV, uTime);
    causticsPattern = smoothstep(0.2, 0.8, causticsPattern);
    
    vec3 causticsColor = vec3(0.4, 0.8, 1.0);
    waterColor += causticsPattern * causticsColor * midEnergy * 0.3;
    
    // Fresnel-like reflection effect
    float fresnel = pow(1.0 - depth, 3.0);
    vec3 reflectionColor = vec3(0.8, 0.9, 1.0);
    waterColor = mix(waterColor, reflectionColor, fresnel * 0.4);
    
    // Audio-reactive glow
    float audioGlow = exp(-length(center) * (2.0 - bassEnergy)) * 0.3;
    waterColor += audioGlow * vec3(0.2, 0.6, 1.0) * highEnergy;
    
    // Animated shimmer
    float shimmer = sin(distortedUV.x * 50.0 + uTime * 2.0) * 
                   sin(distortedUV.y * 50.0 + uTime * 1.5);
    shimmer = smoothstep(0.7, 1.0, shimmer);
    waterColor += shimmer * vec3(1.0, 1.0, 1.0) * 0.1 * midEnergy;
    
    // Final alpha calculation
    float alpha = 0.8 + ripples * 0.2 + depth * 0.2;
    alpha = clamp(alpha, 0.6, 1.0);
    
    fragColor = vec4(waterColor, alpha);
}