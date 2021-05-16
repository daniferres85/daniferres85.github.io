#version 300 es

precision highp float;
in vec4 outColor;
out vec4 fragColor;

vec2 PackDepth16( in float depth )
{
    float depthVal = depth * (256.0*256.0 - 1.0) / (256.0*256.0);
    vec3 encode = fract( depthVal * vec3(1.0, 256.0, 256.0*256.0) );
    return encode.xy - encode.yz / 256.0 + 1.0/512.0;
}
 
void main(void)
{
  fragColor = vec4(PackDepth16(gl_FragCoord.z),0,1);
}