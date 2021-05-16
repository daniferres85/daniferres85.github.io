#version 300 es

invariant gl_Position;
in vec4 vert2d;
in vec2 texCoords;
out vec2 outTexCoords;
uniform mat4 matrix;

void main(void) {
  gl_Position = matrix * vert2d;
  outTexCoords = texCoords;
}