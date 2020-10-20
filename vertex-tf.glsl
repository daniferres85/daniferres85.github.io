#version 300 es

invariant gl_Position;
out vec4 outColor;
in vec3 vert3d;
in vec4 color; 
uniform vec3 brushColor;
uniform float thickness;
uniform mat4 modelViewProjection;
uniform vec4 mouseIntersection;

vec2 ndcToScreen(vec3 ndc)
{
    vec2 scr = vec2((ndc.x + 1.0)/2.0 * 512.0,
                    (1.0 - (ndc.y + 1.0) / 2.0) * 512.0);
    return scr;
}
    
void main(void) {
  gl_Position = modelViewProjection * vec4(vert3d, 1);

  outColor = color;
  if ((mouseIntersection.w == 1.0) && length(vert3d - mouseIntersection.xyz) < thickness)
     outColor = vec4(brushColor,1);
}