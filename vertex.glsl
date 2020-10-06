#version 300 es

invariant gl_Position;
out vec3  outNormal;
out vec4 outColor;
in vec3 vert3d;
in vec3 normal;
    
uniform mat4 modelViewProjection;
uniform mat4 normalMatrix;
uniform vec3 mouseIntersection;

vec2 ndcToScreen(vec3 ndc)
{
    vec2 scr = vec2((ndc.x + 1.0)/2.0 * 512.0,
                    (1.0 - (ndc.y + 1.0) / 2.0) * 512.0);
    return scr;
}
    
void main(void) {
  vec4 t = normalMatrix * vec4(normal, 1);
  outNormal = t.xyz;
  gl_Position = modelViewProjection * vec4(vert3d, 1);

  vec3 ndc = gl_Position.xyz/gl_Position.w;
  vec4 intersectionNdc = modelViewProjection * vec4(mouseIntersection,1);
  vec3 intersectionNdc2 = intersectionNdc.xyz/intersectionNdc.w;
   
  vec2 screen = ndcToScreen(ndc);
  vec2 intScreen = ndcToScreen(intersectionNdc2);
  outColor = vec4(1,0,0,1);
  if (length(screen - intScreen) < 20.0)
     outColor = vec4(0,1,0,1);
}