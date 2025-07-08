// Metaball Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform float uBassSensitivity;
uniform float uAudioData[32];
varying vec2 vUv;

float metaball(vec2 uv, vec2 center, float radius) {
    float dist = length(uv - center);
    return smoothstep(radius, radius - 0.02, dist);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    
    // Audio-reactive parameters
    float bassEnergy = uAudioData[4] * uBassSensitivity;
    float midEnergy = uAudioData[16];
    
    // Animated metaball centers
    vec2 center1 = vec2(sin(uTime * 0.5) * 0.3, cos(uTime * 0.7) * 0.2);
    vec2 center2 = vec2(cos(uTime * 0.3) * 0.4, sin(uTime * 0.6) * 0.3);
    vec2 center3 = vec2(sin(uTime * 0.8) * 0.2, cos(uTime * 0.4) * 0.35);
    
    // Audio-reactive sizes
    float radius1 = 0.15 + bassEnergy * 0.1;
    float radius2 = 0.12 + midEnergy * 0.08;
    float radius3 = 0.18 + bassEnergy * 0.05;
    
    // Calculate metaballs
    float m1 = metaball(uv, center1, radius1);
    float m2 = metaball(uv, center2, radius2);
    float m3 = metaball(uv, center3, radius3);
    
    // Smooth union for organic blending
    float combined = smin(smin(m1, m2, 0.1), m3, 0.1);
    
    // Color gradient based on audio
    vec3 color1 = vec3(1.0, 0.0, 1.0); // Magenta
    vec3 color2 = vec3(0.0, 1.0, 1.0); // Cyan
    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
    
    vec3 finalColor = mix(color1, color2, sin(uTime + bassEnergy) * 0.5 + 0.5);
    finalColor = mix(finalColor, color3, midEnergy);
    
    // Add glow effect
    float glow = exp(-length(uv) * 2.0) * bassEnergy;
    finalColor += glow * vec3(1.0, 0.5, 1.0);
    
    gl_FragColor = vec4(finalColor * combined, combined);
}
