// RGB Split Glitch Fragment Shader
uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uTexture;
uniform float uGlitchIntensity;
uniform float uAudioData[32];
varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
    vec2 uv = vUv;
    
    // Audio-reactive glitch intensity
    float bassEnergy = uAudioData[4];
    float highEnergy = uAudioData[28];
    float totalGlitch = uGlitchIntensity + bassEnergy * 0.5;
    
    // Digital distortion lines
    float lineNoise = random(vec2(floor(uv.y * 100.0), floor(uTime * 10.0)));
    float shouldGlitch = step(0.95, lineNoise) * totalGlitch;
    
    // Horizontal displacement
    float displacement = (random(vec2(floor(uv.y * 50.0), floor(uTime * 5.0))) - 0.5) * shouldGlitch * 0.1;
    uv.x += displacement;
    
    // Chromatic aberration offsets
    float offsetR = totalGlitch * 0.01;
    float offsetG = totalGlitch * 0.005;
    float offsetB = -totalGlitch * 0.01;
    
    // Sample RGB channels separately
    float r = texture2D(uTexture, uv + vec2(offsetR, 0.0)).r;
    float g = texture2D(uTexture, uv + vec2(offsetG, 0.0)).g;
    float b = texture2D(uTexture, uv + vec2(offsetB, 0.0)).b;
    
    vec3 color = vec3(r, g, b);
    
    // Digital noise overlay
    float noisePattern = noise(uv * 100.0 + uTime * 10.0);
    color += noisePattern * 0.1 * highEnergy;
    
    // Scan lines
    float scanline = sin(uv.y * 800.0) * 0.1 * totalGlitch;
    color += scanline;
    
    // VHS-style color bleeding
    if (shouldGlitch > 0.5) {
        color.r = mix(color.r, 1.0, 0.3);
        color.g = mix(color.g, 0.0, 0.2);
        color.b = mix(color.b, 1.0, 0.4);
    }
    
    // Quantization effect
    if (totalGlitch > 0.3) {
        color = floor(color * 8.0) / 8.0;
    }
    
    gl_FragColor = vec4(color, 1.0);
}
