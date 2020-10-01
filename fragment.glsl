#version 300 es

precision highp float;
in vec3 outNormal;
in vec4 outColor;
out vec4 fragColor;

void main(void)
{
  const vec3 L = vec3(0,0,-1);
  vec3 N = normalize(outNormal);
  float lambert = 1./5. + abs(dot(N,L))*4./5.;
  vec3 outRgb = outColor.xyz;  
  fragColor = vec4(outRgb * lambert, outColor.w);
}