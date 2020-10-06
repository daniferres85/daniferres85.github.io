function createGeometry()
{
    return {
        vertices : vertices,
        indices : indices,
        normals : getNormals(vertices, indices),
        intersectionPointFun : (mousePos, camera, viewport) => {
            return get3dIntersection(vertices, indices, mousePos, camera, viewport);
        },
        boundingSphereFun : () => { return getBoundingSphere(vertices); }
    };
}

function createShaders(gl)
{
    var shaderInfo = {
        vertex : "./vertex.glsl",
        fragment: "./fragment.glsl"
    };
    return loadPrograms(gl, [shaderInfo]);
}

function createBuffers(gl, geom)
{
    const vert3dData = new Float32Array([].concat(...geom.vertices));
    const vertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, vert3dData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    const indexData = new Uint16Array([].concat(...geom.indices));
    const indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    const normalData = new Float32Array([].concat(...geom.normals));
    const normalBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return {
        arrayBuffers: [
            {
                id : vertBuf,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert3d"
            },
            {
                id : normalBuf,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "normal"
            }],
        indices: {
            id : indexBuf,
            len : geom.indices.length
        }
    };
}

function createBatches(gl, shaders, buffers)
{
    const vao = gl.createVertexArray();
    const shader = shaders[0];
    
    gl.bindVertexArray(vao);
   
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices.id);

    buffers.arrayBuffers.forEach(b => {
        gl.bindBuffer(gl.ARRAY_BUFFER, b.id);
        const id = gl.getAttribLocation(shader, b.name);
        gl.enableVertexAttribArray(id);
        gl.vertexAttribPointer(id, b.count, b.type, false, b.stride, 0);
    });
    gl.bindVertexArray(null);

    return [{
        vao : vao,
        shader: shader,
        update: (gl) => {},
        render: (gl, context) => {
            gl.useProgram(shader);
            var matrixLocation = gl.getUniformLocation(shader, 'modelViewProjection');
            gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(context.camera));
            
            var normalLocation = gl.getUniformLocation(shader, 'normalMatrix');
            gl.uniformMatrix4fv(normalLocation, false, getNormalMatrix(context.camera));
            
            var intLocation = gl.getUniformLocation(shader, 'mouseIntersection');
            if (context.intersectionPoint != null && context.intersectionPoint.length == 3)
            {
                gl.uniform3fv(intLocation, context.intersectionPoint);
            }

            gl.bindVertexArray(vao);
            
            gl.drawElements(gl.TRIANGLES, 3 * buffers.indices.len,
                            gl.UNSIGNED_SHORT, 0);
            const error = gl.getError();
            if (error !== gl.NO_ERROR) console.log(error);
            gl.bindVertexArray(null);
            gl.useProgram(null);
        }
    }];

}
