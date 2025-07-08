// Water Ripple Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uAudioData[32];
varying vec2 vUv;

float ripple(vec2 uv, vec2 center, float time, float frequency, float amplitude) {
    float dist = length(uv - center);
    float wave = sin(dist * frequency - time * 3.0) * amplitude;
    return wave * exp(-dist * 2.0);
}

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    
    // Audio-driven parameters
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    
    // Multiple ripple sources
    float ripples = 0.0;
    
    // Center ripple (bass-driven)
    ripples += ripple(uv, vec2(0.5), uTime, 20.0 + bassEnergy * 30.0, 0.1 + bassEnergy * 0.2);
    
    // Mouse/interaction ripple
    ripples += ripple(uv, uMouse, uTime, 15.0, 0.08);
    
    // Audio-reactive ripples at corners
    ripples += ripple(uv, vec2(0.2, 0.8), uTime + midEnergy, 25.0, 0.06 + midEnergy * 0.1);
    ripples += ripple(uv, vec2(0.8, 0.2), uTime + highEnergy, 30.0, 0.05 + highEnergy * 0.08);
    
    // Distort UV coordinates
    vec2 distortedUV = uv + ripples * 0.1;
    
    // Create water-like gradient
    float gradient = length(center) * 2.0;
    gradient = 1.0 - gradient;
    
    // Color mixing
    vec3 deepWater = vec3(0.0, 0.1, 0.3);
    vec3 shallowWater = vec3(0.0, 0.5, 0.8);
    vec3 foam = vec3(0.8, 0.9, 1.0);
    
    vec3 waterColor = mix(deepWater, shallowWater, gradient);
    
    // Add foam where ripples are strong
    float foamMask = smoothstep(0.05, 0.1, abs(ripples));
    waterColor = mix(waterColor, foam, foamMask * bassEnergy);
    
    // Caustics effect
    float caustics = sin(distortedUV.x * 10.0 + uTime) * sin(distortedUV.y * 10.0 + uTime * 0.7);
    caustics = smoothstep(0.3, 0.7, caustics);
    waterColor += caustics * vec3(0.2, 0.4, 0.6) * midEnergy;
    
    // Fresnel-like effect
    float fresnel = pow(1.0 - gradient, 2.0);
    waterColor = mix(waterColor, vec3(0.0, 0.8, 1.0), fresnel * 0.3);
    
    gl_FragColor = vec4(waterColor, 0.8 + ripples * 0.2);
}
