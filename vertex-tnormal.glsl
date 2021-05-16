#version 300 es

invariant gl_Position;
out vec3  outNormal;
out vec4 outColor;
in vec3 vert3d0;
in vec3 vert3d1;
in vec3 vert3d2;
    
uniform mat4 modelViewProjection;
uniform mat4 normalMatrix;
uniform vec4 mouseIntersection;
    
void main(void) {
    vec3 a = vert3d1 - vert3d0;
    vec3 b = vert3d2 - vert3d0;
    vec3 n = normalize(cross(a, b));
    vec4 t = normalMatrix * vec4(n, 1);
    outNormal = t.xyz;
    gl_Position = modelViewProjection * vec4(vert3d0, 1);
    if (mouseIntersection.w != 0.0 && length(mouseIntersection.xyz - vert3d0) < 0.05)
        outColor = vec4(1,1,0,1);
    else
        outColor = vec4(0.5,0,1,1);
}