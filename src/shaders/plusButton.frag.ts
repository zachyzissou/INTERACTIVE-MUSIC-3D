const fragmentShader = `precision highp float;
varying vec2 vUv;
uniform float uDistort;
uniform vec3 uColor;
float sdPlus(vec2 p,float b,float t){
  p=abs(p);
  p-=b;
  if(p.x<0.0||p.y<0.0) return max(p.x,p.y)-t;
  return length(max(p,0.0))-t;
}
void main(){
  vec2 p=vUv*2.0-1.0;
  float d=sdPlus(p,0.2,0.05-uDistort*0.05);
  float a=smoothstep(0.02,0.0,d);
  gl_FragColor=vec4(uColor,a);
}`;

export default fragmentShader;