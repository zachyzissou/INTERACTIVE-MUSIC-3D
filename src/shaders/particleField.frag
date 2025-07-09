// Particle Field Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioData[32];
uniform vec2 uMouse;
varying vec2 vUv;

// Hash function for pseudo-random number generation
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Smooth noise function
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

// Particle system simulation
vec3 particleField(vec2 st, float time, float audioEnergy) {
    vec3 color = vec3(0.0);
    
    // Grid of particles
    vec2 grid = st * 20.0;
    vec2 ipos = floor(grid);
    vec2 fpos = fract(grid);
    
    // Particle properties based on grid position
    float particleId = dot(ipos, vec2(1.0, 113.0));
    vec2 velocity = hash(ipos) * 2.0;
    
    // Audio-reactive movement
    float phase = particleId + time * (1.0 + audioEnergy * 2.0);
    vec2 particlePos = fpos + sin(phase + velocity) * 0.3 * audioEnergy;
    
    // Particle distance and size
    float distance = length(particlePos - vec2(0.5));
    float particleSize = 0.02 + audioEnergy * 0.03;
    
    // Audio-reactive particle intensity
    float bassInfluence = uAudioData[int(mod(particleId, 8.0))];
    float midInfluence = uAudioData[int(mod(particleId, 16.0) + 8.0)];
    float highInfluence = uAudioData[int(mod(particleId, 8.0) + 24.0)];
    
    // Particle core
    float particle = smoothstep(particleSize, particleSize * 0.5, distance);
    particle *= 1.0 + bassInfluence * 2.0;
    
    // Color based on audio frequencies
    vec3 particleColor = vec3(
        0.5 + bassInfluence * 0.5,
        0.3 + midInfluence * 0.7,
        0.8 + highInfluence * 0.2
    );
    
    color += particle * particleColor;
    
    // Connection lines between nearby particles
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            if (x == 0 && y == 0) continue;
            
            vec2 neighborGrid = ipos + vec2(float(x), float(y));
            float neighborId = dot(neighborGrid, vec2(1.0, 113.0));
            vec2 neighborVelocity = hash(neighborGrid) * 2.0;
            
            float neighborPhase = neighborId + time * (1.0 + audioEnergy * 2.0);
            vec2 neighborPos = vec2(float(x), float(y)) + vec2(0.5) + sin(neighborPhase + neighborVelocity) * 0.3 * audioEnergy;
            
            vec2 connectionVector = neighborPos - particlePos;
            float connectionDistance = length(connectionVector);
            
            // Draw connection if particles are close
            if (connectionDistance < 0.8) {
                float connectionStrength = 1.0 - connectionDistance / 0.8;
                connectionStrength *= audioEnergy;
                
                // Line rendering (simplified)
                vec2 lineDirection = normalize(connectionVector);
                vec2 perpendicular = vec2(-lineDirection.y, lineDirection.x);
                
                float linePosition = dot(fpos - particlePos, lineDirection);
                float lineWidth = abs(dot(fpos - particlePos, perpendicular));
                
                if (linePosition >= 0.0 && linePosition <= connectionDistance && lineWidth < 0.005) {
                    color += vec3(0.2, 0.4, 0.8) * connectionStrength * 0.5;
                }
            }
        }
    }
    
    return color;
}

// Flow field effect
vec2 flowField(vec2 st, float time) {
    float angle = noise(st * 4.0 + time * 0.5) * 6.28318;
    return vec2(cos(angle), sin(angle));
}

// Trail effect for particles
vec3 particleTrails(vec2 st, float time, float audioEnergy) {
    vec3 trails = vec3(0.0);
    
    // Multiple trail layers
    for (int i = 0; i < 5; i++) {
        float trailTime = time - float(i) * 0.1;
        vec2 trailPosition = st;
        
        // Apply flow field
        for (int j = 0; j < 10; j++) {
            vec2 flow = flowField(trailPosition, trailTime - float(j) * 0.05);
            trailPosition += flow * 0.01 * audioEnergy;
        }
        
        // Calculate trail intensity
        float trailIntensity = exp(-float(i) * 0.5) * audioEnergy;
        
        // Add to trails
        trails += particleField(trailPosition, trailTime, audioEnergy * 0.5) * trailIntensity * 0.3;
    }
    
    return trails;
}

void main() {
    vec2 st = vUv;
    
    // Audio reactivity
    float bassEnergy = uAudioData[4];
    float midEnergy = uAudioData[16];
    float highEnergy = uAudioData[28];
    float totalEnergy = (bassEnergy + midEnergy + highEnergy) / 3.0;
    
    // Mouse interaction
    vec2 mouseInfluence = vec2(0.0);
    if (length(uMouse) > 0.01) {
        float mouseDist = length(st - uMouse);
        mouseInfluence = normalize(st - uMouse) * exp(-mouseDist * 5.0) * 0.1;
    }
    
    // Apply mouse influence to coordinate system
    st += mouseInfluence;
    
    // Time modulation
    float audioTime = uTime + totalEnergy;
    
    // Generate particle field
    vec3 particles = particleField(st, audioTime, totalEnergy);
    
    // Add particle trails
    vec3 trails = particleTrails(st, audioTime, totalEnergy * 0.7);
    
    // Background gradient
    float gradient = length(st - vec2(0.5)) * 2.0;
    gradient = 1.0 - gradient;
    gradient = clamp(gradient, 0.0, 1.0);
    
    vec3 backgroundColor = vec3(0.05, 0.05, 0.15) * gradient;
    
    // Combine all effects
    vec3 finalColor = backgroundColor + particles + trails;
    
    // Audio-reactive brightness boost
    finalColor *= 0.8 + 0.4 * totalEnergy;
    
    // Add glow effect around edges
    float edgeGlow = exp(-length(st - vec2(0.5)) * 3.0) * bassEnergy;
    finalColor += vec3(0.3, 0.6, 1.0) * edgeGlow * 0.5;
    
    // Color correction and enhancement
    finalColor = pow(finalColor, vec3(0.8)); // Gamma correction
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}