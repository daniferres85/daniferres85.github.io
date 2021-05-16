#version 300 es

precision highp float;
in vec2 outTexCoords;
uniform sampler2D texture0;
out vec4 fragColor;

void main(void)
{
    float full_depth = floor(texture( texture0, outTexCoords.st ).x * 65535.0 + 0.5);
    float high_depth = floor(full_depth/256.0);
    float low_depth = full_depth - high_depth * 256.0;
    fragColor = vec4(high_depth, low_depth/255.0, 0.0, 1.0);
}