#version 300 es

invariant gl_Position;
out vec3  outNormal;
out vec4 outColor;
in vec3 vert3d;
in vec3 normal;
in vec4 color;
    
uniform mat4 modelViewProjection;
uniform mat4 normalMatrix;

void main(void) {
  vec4 t = normalMatrix * vec4(normal, 1);
  outNormal = t.xyz;
  gl_Position = modelViewProjection * vec4(vert3d, 1);
  outColor = color;
}