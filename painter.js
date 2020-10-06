function createGeometry()
{
    return {
        vertices : vertices,
        indices : indices,
        normals : getNormals(vertices, indices),
        colors : Array(vertices.length).fill([1,0,0,1]),
        intersectionPointFun : (mousePos, camera, viewport) => {
            return get3dIntersection(vertices, indices, mousePos, camera, viewport);
        },
        boundingSphereFun : () => { return getBoundingSphere(vertices); }
    };
}

function createShaders(gl)
{
    var shaderInfo = [
        {
            vertex : "./vertex.glsl",
            fragment: "./fragment.glsl",
            tfv: null
        },
        {
            vertex : "./vertex-tf.glsl",
            fragment: "./fragment-tf.glsl",
            tfv: ["outColor"]
        }];

    return loadPrograms(gl, shaderInfo);
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

    const colorData = new Float32Array([].concat(...geom.colors));
    const colorBuf = [gl.createBuffer(), gl.createBuffer()];
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf[0]);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf[1]);
    gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return {
        arrayBuffers: [
            {
                id : vertBuf,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert3d",
                nvertices: vertices.length
            },
            {
                id : normalBuf,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "normal"
            },
            {
                id: colorBuf[0],
                type: gl.FLOAT,
                count: 4,
                stride: 4 * Float32Array.BYTES_PER_ELEMENT,
                name: "color"
            },
            {
                id: colorBuf[1],
                type: gl.FLOAT,
                count: 4,
                stride: 4 * Float32Array.BYTES_PER_ELEMENT,
                name: "color"
            }
        ],
        indices: {
            id : indexBuf,
            len : geom.indices.length
        }
    };
}

function bindBuffer(gl, arrayBuffer, program)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, arrayBuffer.id);
    const id = gl.getAttribLocation(program, arrayBuffer.name);
    gl.enableVertexAttribArray(id);
    gl.vertexAttribPointer(id, arrayBuffer.count, arrayBuffer.type, false, arrayBuffer.stride, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function createBatches(gl, programs, buffers)
{
    var batches = [];

    // create the transform feedback vaos
    const tfvaos = [gl.createVertexArray(), gl.createVertexArray()];
    const program = programs[1];
    
    for (var i = 0; i < tfvaos.length; ++i)
    {
        gl.bindVertexArray(tfvaos[i]);
        bindBuffer(gl, buffers.arrayBuffers[0], program) // vertices
        bindBuffer(gl, buffers.arrayBuffers[2 + i], program); // color
        gl.bindVertexArray(null);

        const ii = i.valueOf();
        batches.push({
            update: (gl) => {},
            render: (gl, context) => {
                
                if (context.pingPong == ii)
                {
                    // pp0->vao[0]->rd:2 wr:3
                    // pp1->vao[1]->rd:3 wr:2
                    return;
                }
                gl.disable(gl.DEPTH_TEST);
                gl.useProgram(program);
                var matrixLocation = gl.getUniformLocation(program, 'modelViewProjection');
                gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(context.camera));
                
                var intLocation = gl.getUniformLocation(program, 'mouseIntersection');

                var intPoint = [];
                if (context.intersectionPoint == null)
                    intPoint = [0,0,0,0];
                else
                    intPoint = [context.intersectionPoint[0],
                                context.intersectionPoint[1],
                                context.intersectionPoint[2],
                                1];
                gl.uniform4fv(intLocation, intPoint);

                gl.bindVertexArray(tfvaos[ii]);

                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.arrayBuffers[2 + (1 - ii)].id);
                
                gl.enable(gl.RASTERIZER_DISCARD);
                
                gl.beginTransformFeedback(gl.POINTS);
                gl.drawArrays(gl.POINTS, 0, buffers.arrayBuffers[0].nvertices);
                const error = gl.getError();
                if (error !== gl.NO_ERROR) console.log(error);
                gl.endTransformFeedback();
                gl.disable(gl.RASTERIZER_DISCARD);
                gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
                gl.bindVertexArray(null);
                gl.useProgram(null);
            }});
    }
    
    // create the render batch
    const renderVaos = [gl.createVertexArray(), gl.createVertexArray()];
    
    for (var i = 0; i < renderVaos.length; ++i)
    {
        const program = programs[0];
        
        gl.bindVertexArray(renderVaos[i]);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices.id);
        
        buffers.arrayBuffers.forEach(b => {
            bindBuffer(gl, buffers.arrayBuffers[0], program) // vertices
            bindBuffer(gl, buffers.arrayBuffers[1], program) // normals
            bindBuffer(gl, buffers.arrayBuffers[2 + i], program); // color

        });
        
        gl.bindVertexArray(null);
        const ii = i.valueOf();
        batches.push(
            {
                update: (gl) => {},
                render: (gl, context) => {
                    if (context.pingPong != ii)
                    {
                        // pp0->vao[1]->rd:3
                        // pp1->vao[0]->rd:2
                        return;
                    }
                    gl.enable(gl.DEPTH_TEST);
                    

                    gl.useProgram(program);
                    var matrixLocation = gl.getUniformLocation(program, 'modelViewProjection');
                    gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(context.camera));
                    
                    var normalLocation = gl.getUniformLocation(program, 'normalMatrix');
                    gl.uniformMatrix4fv(normalLocation, false, getNormalMatrix(context.camera));
                    
                    gl.bindVertexArray(renderVaos[ii]);
                    
                    gl.drawElements(gl.TRIANGLES, 3 * buffers.indices.len,
                                    gl.UNSIGNED_SHORT, 0);
                    const error = gl.getError();
                    if (error !== gl.NO_ERROR) console.log(error);
                    gl.bindVertexArray(null);
                    gl.useProgram(null);
                }
            });
    }
    return batches;
}
