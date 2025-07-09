// Advanced Ripple Effects Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioData[32];
uniform vec2 uMouse;
varying vec2 vUv;

// Improved ripple function with audio reactivity
float ripple(vec2 uv, vec2 center, float time, float frequency, float amplitude, float decay) {
    float distance = length(uv - center);
    float wave = sin(distance * frequency - time) * amplitude;
    return wave * exp(-distance * decay);
}

// Multi-layered ripple system
float multiRipple(vec2 uv, vec2 center, float time, float audioEnergy) {
    float ripples = 0.0;
    
    // Primary ripple
    ripples += ripple(uv, center, time * 5.0, 30.0 + audioEnergy * 20.0, 0.3, 3.0);
    
    // Secondary ripple (half frequency)
    ripples += ripple(uv, center, time * 3.0, 15.0 + audioEnergy * 10.0, 0.2, 2.5) * 0.7;
    
    // Tertiary ripple (quarter frequency)
    ripples += ripple(uv, center, time * 2.0, 8.0 + audioEnergy * 5.0, 0.15, 2.0) * 0.5;
    
    return ripples;
}

// Interference pattern between multiple ripples
float interferencePattern(vec2 uv, float time, float bassEnergy, float midEnergy) {
    float pattern = 0.0;
    
    // Multiple ripple sources
    vec2 center1 = vec2(0.3, 0.3) + vec2(sin(time * 0.3), cos(time * 0.4)) * 0.2;
    vec2 center2 = vec2(0.7, 0.7) + vec2(cos(time * 0.5), sin(time * 0.6)) * 0.2;
    vec2 center3 = vec2(0.2, 0.8) + vec2(sin(time * 0.7), cos(time * 0.3)) * 0.15;
    vec2 center4 = vec2(0.8, 0.2) + vec2(cos(time * 0.4), sin(time * 0.8)) * 0.15;
    
    // Audio-reactive ripples
    pattern += multiRipple(uv, center1, time, bassEnergy);
    pattern += multiRipple(uv, center2, time + 1.0, bassEnergy * 0.8);
    pattern += multiRipple(uv, center3, time + 2.0, midEnergy);
    pattern += multiRipple(uv, center4, time + 3.0, midEnergy * 0.7);
    
    // Mouse interaction ripple
    if (length(uMouse) > 0.01) {
        pattern += multiRipple(uv, uMouse, time, bassEnergy + midEnergy);
    }
    
    return pattern;
}

// Caustics effect for underwater feel
float caustics(vec2 uv, float time) {
    vec2 p = uv * 8.0;
    float caustic = 0.0;
    
    for (int i = 0; i < 3; i++) {
        float t = time + float(i) * 1.3;
        vec2 offset = vec2(sin(t * 0.8), cos(t * 0.6)) * 0.3;
        
        float wave1 = sin(p.x + offset.x + t);
        float wave2 = sin(p.y + offset.y + t * 1.1);
        float wave3 = sin((p.x + p.y) * 0.7 + offset.x + t * 0.9);
        
        caustic += (wave1 + wave2 + wave3) / 3.0;
        p *= 1.3;
    }
    
    return caustic * 0.5 + 0.5;
}

void main() {
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    
    // Audio data extraction
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16]; 
    float highEnergy = uAudioData[28];
    float totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3.0;
    
    // Time with audio modulation
    float audioTime = uTime + totalEnergy * 2.0;
    
    // Calculate interference pattern
    float ripples = interferencePattern(uv, audioTime, bassEnergy, midEnergy);
    
    // Add caustics layer
    float causticsLayer = caustics(uv + ripples * 0.1, audioTime * 0.5);
    
    // Calculate distance-based effects
    float distanceFromCenter = length(uv - center);
    
    // Create gradient base
    float gradient = 1.0 - distanceFromCenter * 1.5;
    gradient = clamp(gradient, 0.0, 1.0);
    
    // Distort UV coordinates based on ripples
    vec2 distortedUV = uv + ripples * 0.05 * (1.0 + bassEnergy);
    
    // Color palette (water-like)
    vec3 deepWater = vec3(0.0, 0.1, 0.4);
    vec3 midWater = vec3(0.0, 0.3, 0.8);
    vec3 shallowWater = vec3(0.2, 0.6, 1.0);
    vec3 foam = vec3(0.8, 0.9, 1.0);
    vec3 causticColor = vec3(0.4, 0.8, 1.0);
    
    // Base water color
    vec3 waterColor = mix(deepWater, midWater, gradient);
    waterColor = mix(waterColor, shallowWater, gradient * gradient);
    
    // Add ripple effects to color
    float rippleIntensity = abs(ripples);
    waterColor = mix(waterColor, foam, smoothstep(0.1, 0.3, rippleIntensity) * bassEnergy);
    
    // Add caustics
    waterColor += causticColor * causticsLayer * 0.3 * midEnergy;
    
    // Fresnel-like effect
    float fresnel = pow(1.0 - gradient, 2.0);
    waterColor = mix(waterColor, vec3(0.9, 0.95, 1.0), fresnel * 0.4);
    
    // Audio-reactive brightness modulation
    waterColor *= 0.7 + 0.5 * totalEnergy;
    
    // Edge glow
    float edgeGlow = exp(-distanceFromCenter * 4.0) * highEnergy;
    waterColor += vec3(0.5, 0.8, 1.0) * edgeGlow * 0.5;
    
    // Reflection highlights
    float reflection = smoothstep(0.0, 0.1, abs(ripples));
    waterColor += reflection * vec3(1.0, 1.0, 1.0) * 0.6 * midEnergy;
    
    // Final alpha with ripple-based transparency
    float alpha = 0.85 + rippleIntensity * 0.15;
    
    gl_FragColor = vec4(waterColor, alpha);
}