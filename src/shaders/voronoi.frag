// Voronoi Cells Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform float uAudioData[32];
varying vec2 vUv;

vec2 random2(vec2 st) {
    st = vec2(dot(st, vec2(127.1, 311.7)),
              dot(st, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

float voronoi(vec2 st) {
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);
    
    float m_dist = 1.0;
    
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = random2(i_st + neighbor);
            
            // Audio-reactive animation
            point = 0.5 + 0.5 * sin(uTime + 6.2831 * point + uAudioData[8] * 2.0);
            
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);
            
            m_dist = min(m_dist, dist);
        }
    }
    
    return m_dist;
}

void main() {
    vec2 st = vUv * 8.0;
    
    // Audio reactivity
    float bassEnergy = uAudioData[4];
    float highEnergy = uAudioData[24];
    
    // Animate scale with audio
    st += sin(uTime * 0.5 + bassEnergy * 5.0) * 0.1;
    
    float voronoiPattern = voronoi(st);
    
    // Create cells
    float cells = smoothstep(0.0, 0.1, voronoiPattern);
    cells = 1.0 - cells;
    
    // Color based on audio frequencies
    vec3 color1 = vec3(0.1, 0.9, 1.0); // Cyan
    vec3 color2 = vec3(1.0, 0.1, 0.9); // Magenta
    vec3 color3 = vec3(0.9, 1.0, 0.1); // Yellow-green
    
    vec3 finalColor = mix(color1, color2, sin(uTime + bassEnergy) * 0.5 + 0.5);
    finalColor = mix(finalColor, color3, highEnergy);
    
    // Edge glow
    float edges = smoothstep(0.05, 0.15, voronoiPattern);
    edges = 1.0 - edges;
    
    finalColor += edges * vec3(1.0, 1.0, 1.0) * bassEnergy;
    
    gl_FragColor = vec4(finalColor * cells, 1.0);
}
