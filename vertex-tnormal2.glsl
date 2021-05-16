#version 300 es

invariant gl_Position;
out vec4 outColor;
in vec3 vert3d0;
    
uniform mat4 modelViewProjection;
void main(void) {
    gl_Position = modelViewProjection * vec4(vert3d0, 1);
    outColor = vec4(gl_Position.z, 0, 0, 1);
}