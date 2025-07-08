// Metaball Fragment Shader - GLSL Version
#version 300 es
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform float uBassSensitivity;
uniform float uAudioData[32];
uniform float uAudioLevel;

in vec2 vUv;
out vec4 fragColor;

// Smooth minimum function for organic blending
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Metaball distance function
float metaball(vec2 uv, vec2 center, float radius) {
    float dist = length(uv - center);
    return radius / (dist + 0.001);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Audio-reactive parameters
    float bassEnergy = uAudioData[4] * uBassSensitivity;
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Animated metaball centers with audio reactivity
    vec2 center1 = vec2(
        sin(uTime * 0.5 + bassEnergy * 2.0) * 0.4,
        cos(uTime * 0.7 + midEnergy * 1.5) * 0.3
    );
    vec2 center2 = vec2(
        cos(uTime * 0.3 + highEnergy * 1.8) * 0.5,
        sin(uTime * 0.6 + bassEnergy * 1.2) * 0.4
    );
    vec2 center3 = vec2(
        sin(uTime * 0.8 + midEnergy * 2.5) * 0.3,
        cos(uTime * 0.4 + highEnergy * 2.0) * 0.45
    );
    
    // Audio-reactive sizes
    float radius1 = 0.15 + bassEnergy * 0.2;
    float radius2 = 0.12 + midEnergy * 0.15;
    float radius3 = 0.18 + highEnergy * 0.1;
    
    // Calculate metaball fields
    float m1 = metaball(uv, center1, radius1);
    float m2 = metaball(uv, center2, radius2);
    float m3 = metaball(uv, center3, radius3);
    
    // Combine metaballs
    float field = m1 + m2 + m3;
    float threshold = 1.0 + uAudioLevel * 0.5;
    
    // Create smooth falloff
    float alpha = smoothstep(threshold - 0.1, threshold + 0.1, field);
    
    // Dynamic color palette based on audio
    vec3 color1 = vec3(1.0, 0.2, 0.8); // Hot pink
    vec3 color2 = vec3(0.2, 0.8, 1.0); // Cyan
    vec3 color3 = vec3(0.8, 1.0, 0.2); // Lime
    
    vec3 finalColor = mix(color1, color2, sin(uTime + bassEnergy * 3.0) * 0.5 + 0.5);
    finalColor = mix(finalColor, color3, highEnergy);
    
    // Add pulsing glow effect
    float glow = exp(-length(uv) * (2.0 - bassEnergy)) * (0.5 + midEnergy);
    finalColor += glow * vec3(1.0, 0.6, 1.0);
    
    // Apply field intensity to brightness
    finalColor *= (0.5 + field * 0.1);
    
    fragColor = vec4(finalColor, alpha);
}