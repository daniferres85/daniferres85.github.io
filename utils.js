function getBoundingBox(vertices3d)
{
    var minX = Math.min(...vertices3d.map(x => x[0]));
    var maxX = Math.max(...vertices3d.map(x => x[0]));
                        
    var minY = Math.min(...vertices3d.map(x => x[1]));
    var maxY = Math.max(...vertices3d.map(x => x[1]));

    var minZ = Math.min(...vertices3d.map(x => x[2]));
    var maxZ = Math.max(...vertices3d.map(x => x[2]));

    var center = [0.5 * (maxX + minX),
                  0.5 * (maxY + minY),
                  0.5 * (maxZ + minZ)];
    var extents = [maxX - center[0],
                   maxY - center[1],
                   maxZ - center[2]];
    var bbox = {
        center : center,
        extents: extents};
    
    return bbox;
}

function calcModulus(vec3d)
{
    return Math.sqrt(vec3d[0] * vec3d[0] + vec3d[1] * vec3d[1] + vec3d[2] * vec3d[2]);
}
function getBoundingSphere(vertices3d)
{
    const bbox = getBoundingBox(vertices3d);
    var center = bbox.center;
    var radius = calcModulus(bbox.extents);
    
    var bsphere = {
        center : center,
        radius : radius};
    
    return bsphere;
}

function getNormals(vertices, indices)
{
    var normals = Array(vertices.length).fill(Array(3).fill(0));
    for(var i = 0; i < indices.length; ++i)
    {
        var v0 = vertices[indices[i][0]];
        var v1 = vertices[indices[i][1]];
        var v2 = vertices[indices[i][2]];
        var a = [];
        vec3.sub(a, v1, v0);
        var b = [];
        vec3.sub(b, v2, v0);
        var cross = [];
        vec3.cross(cross, a, b);
        var n = [];
        vec3.normalize(n, cross);
        var res0 = [];
        vec3.add(res0, normals[indices[i][0]], n);
        var res1 = [];
        vec3.add(res1, normals[indices[i][1]], n);
        var res2 = [];
        vec3.add(res2, normals[indices[i][2]], n);
        normals[indices[i][0]] = res0;
        normals[indices[i][1]] = res1;
        normals[indices[i][2]] = res2;
    }
    return normals;
}

function drawImage(gl, program, tex, texWidth, texHeight) {

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");
    var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
    
    // lookup uniforms
    var matrixLocation = gl.getUniformLocation(program, "u_matrix");
    var textureLocation = gl.getUniformLocation(program, "u_texture");
    
    // Create a buffer.
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Put a unit quad in the buffer
    var positions = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    // Create a buffer for texture coords
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    
    // Put texcoords in the buffer
    var texcoords = [
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    gl.bindTexture(gl.TEXTURE_2D, tex);

    // Tell WebGL to use our shader program pair
    gl.useProgram(program);

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // this matrix will convert from pixels to cli space
    var matrix = [];
    mat4.ortho(matrix, 0, 512,512, 0, -1, 1);

    // this matrix will translate our quad to dstX, dstY

    // this matrix will scale our 1 unit quad
    // from 1 unit to texWidth, texHeight units
    mat4.scale(matrix, matrix, texWidth, texHeight, 1);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(textureLocation, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
