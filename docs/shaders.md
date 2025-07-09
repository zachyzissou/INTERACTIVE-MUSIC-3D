# Shader Reference

This document outlines custom GLSL shaders used in Oscillo. The `metaball.frag` shader supports real-time audio reactivity and adjustable bass sensitivity.

```
float metaball(vec2 uv, vec2 center, float radius) {
  float dist = length(uv - center);
  return smoothstep(radius, radius - 0.02, dist);
}

void main() {
  float m1 = metaball(vUv, vec2(0.5, 0.5), 0.25);
  float m2 = metaball(vUv, vec2(0.7, 0.6), 0.15);
  float combined = clamp(m1 + m2, 0.0, 1.0);
  gl_FragColor = vec4(vec3(combined), 1.0);
}
```

