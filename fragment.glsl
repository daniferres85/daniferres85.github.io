#version 300 es

precision highp float;
in vec3 outNormal;
in vec4 outColor;
out vec4 fragColor;

void main(void)
{
  float lambert = 0.5 + 0.5 * abs(dot(normalize(outNormal), vec3(0,0,-1)));
  fragColor.xyz = outColor.xyz * lambert;
  fragColor.w = 1.0;
}