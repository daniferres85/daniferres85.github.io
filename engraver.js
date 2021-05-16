var depthSurface = new Uint8Array(512 * 512 * 4);;


function getIntersectionPointUsingDepthTexture(mousePos, camera, viewport)
{
    var y = 512 - mousePos[1];
    var x = mousePos[0];

    var r = depthSurface[y * viewport[0] * 4 + x * 4 + 0];
    var g = depthSurface[y * viewport[0] * 4 + x * 4 + 1];
    var b = depthSurface[y * viewport[0] * 4 + x * 4 + 2];
    if (r == 255 && g == 255)
        return null;
    var depth = (r * 256 + g)/65535;
    console.log([r, g , b]);
    var nx = (mousePos[0] + 0.5) * 2 / viewport[0] - 1;
    var ny = 2 - (mousePos[1] + 0.5) * 2 / viewport[1] - 1;
    var p = [];
    var invvp = getViewProjection(camera);
    mat4.invert(p, invvp);
    var res = [];
    vec4.transformMat4(res, [nx, ny, 2 * depth - 1, 1], p);
    return [res[0]/res[3], res[1]/res[3], res[2]/res[3]];
}

function createGeometry()
{
    const width = 1000;
    const height = 1000;
    var vertices0 = [];
    var vertices1 = [];
    var vertices2 = [];
    for (var r = 0; r < height - 1; ++r)
    {
        var ytop = r / height - 0.5; // y from -0.5 to 0.5
        var ybottom = (r + 1) / height - 0.5; 
        for (var c = 0; c < width - 1; ++c)
        {
            var xleft = c / width - 0.5; // x from -0.5 to 0.5
            var xright = (c + 1) / width - 0.5;

/*            var v0 = [xleft,ytop, Math.sin(Math.PI * c/width)];
            var v1 = [xright,ytop,Math.sin(Math.PI * (c + 1)/width)];
            var v2 = [xleft,ybottom,Math.sin(Math.PI * c/width)];
            var v3 = [xright,ybottom,Math.sin(Math.PI * (c + 1)/width)];*/

            var v0 = [xleft,ytop, 0];
            var v1 = [xright,ytop,0];
            var v2 = [xleft,ybottom,0];
            var v3 = [xright,ybottom,0];
            
            vertices0.push(v0[0]); vertices0.push(v0[1]); vertices0.push(v0[2])
            vertices0.push(v2[0]); vertices0.push(v2[1]); vertices0.push(v2[2]);
            vertices0.push(v1[0]); vertices0.push(v1[1]); vertices0.push(v1[2]);
            vertices0.push(v2[0]); vertices0.push(v2[1]); vertices0.push(v2[2]);
            vertices0.push(v3[0]); vertices0.push(v3[1]); vertices0.push(v3[2]);
            vertices0.push(v1[0]); vertices0.push(v1[1]); vertices0.push(v1[2]);

            vertices1.push(v2[0]); vertices1.push(v2[1]); vertices1.push(v2[2]);
            vertices1.push(v1[0]); vertices1.push(v1[1]); vertices1.push(v1[2]);
            vertices1.push(v0[0]); vertices1.push(v0[1]); vertices1.push(v0[2]);
            vertices1.push(v3[0]); vertices1.push(v3[1]); vertices1.push(v3[2]);
            vertices1.push(v1[0]); vertices1.push(v1[1]); vertices1.push(v1[2]);
            vertices1.push(v2[0]); vertices1.push(v2[1]); vertices1.push(v2[2]);

            vertices2.push(v1[0]); vertices2.push(v1[1]); vertices2.push(v1[2]);
            vertices2.push(v0[0]); vertices2.push(v0[1]); vertices2.push(v0[2]);
            vertices2.push(v2[0]); vertices2.push(v2[1]); vertices2.push(v2[2]);
            vertices2.push(v1[0]); vertices2.push(v1[1]); vertices2.push(v1[2]);
            vertices2.push(v2[0]); vertices2.push(v2[1]); vertices2.push(v2[2]);
            vertices2.push(v3[0]); vertices2.push(v3[1]); vertices2.push(v3[2]);
        }
    }

    var reducedVertices = [];
    for (var r = 0; r < height; ++r)
    {
        var y = r / height - 0.5; // y from -0.5 to 0.5
        for (var c = 0; c < width; ++c)
        {
            var x = c / width - 0.5; // x from -0.5 to 0.5
            reducedVertices.push([x,y,Math.sin(Math.PI * c/width)]);
        }
    }

    var indices = [];
    for (var r = 0; r < height - 1; ++r)
    {
        for (var c = 0; c < width - 1; ++c)
        {
            indices.push([r * width + c + 0,
                          (r + 1) * width + c + 0,
                          r * width + c + 1]);

            indices.push([(r + 1) * width + c + 0,
                          (r + 1) * width + c + 1,
                          r * width + c + 1]);
        }
    }

    const thicknessSlider = document.getElementById("toolThickness");
    
    // now that we know the extents of our model, setup the slider
    thicknessSlider.min = 0.001;
    thicknessSlider.max = 1;
    thicknessSlider.step = 0.01;
    thicknessSlider.value = (thicknessSlider.max + thicknessSlider.min)/2;

    return {
        vertices : [vertices0, vertices1, vertices2],
        intersectionPointFun : (mousePos, camera, viewport) => {
            //return getNearestVertex(reducedVertices, mousePos, camera, viewport);
            return getIntersectionPointUsingDepthTexture(mousePos, camera, viewport);
        },
        boundingSphereFun : () => { return {center: [0,0,0], radius: 1}; }
    };
}

function createShaders(gl)
{
    var shaderInfo = [
        {
            vertex : "./vertex-tnormal.glsl",
            fragment: "./fragment.glsl",
            tfv: null
        },
        {
            vertex : "./vertex-tex.glsl",
            fragment: "./fragment-tex.glsl",
            tfv: null
        },
        {
            vertex : "./vertex-tnormal2.glsl",
            fragment: "./fragment2.glsl",
            tfv: null
        }
    ];

    return loadPrograms(gl, shaderInfo);
}

function createBuffers(gl, geom)
{

    // we need buffers for: positions, indices, normals, and 2x colors (for transform feedback)
    const vert3dData0 = new Float32Array(geom.vertices[0]);
    const vertBuf0 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf0);
    gl.bufferData(gl.ARRAY_BUFFER, vert3dData0, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const vert3dData1 = new Float32Array(geom.vertices[1]);
    const vertBuf1 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf1);
    gl.bufferData(gl.ARRAY_BUFFER, vert3dData1, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const vert3dData2 = new Float32Array(geom.vertices[2]);
    const vertBuf2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf2);
    gl.bufferData(gl.ARRAY_BUFFER, vert3dData2, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const texVertices = new Float32Array([0, 0,
                                          0, 1,
                                          1, 0,
                                          1, 0,
                                          0, 1,
                                          1, 1]);
    const texVertBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texVertBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texVertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const texCoords = new Float32Array([
        0, 0,
        0, 1,
        1, 0,
        1, 0,
        0, 1,
        1, 1
    ]);
    const texCoordsBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create a color texture
    var colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    
    return {
        arrayBuffers: [
            {
                id : vertBuf0,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert3d0",
                nvertices: geom.vertices[0].length/3
            },
            {
                id : vertBuf1,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert3d1",
                nvertices: geom.vertices[1].length/3
            },
            {
                id : vertBuf2,
                type: gl.FLOAT,
                count: 3,
                stride: 3 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert3d2",
                nvertices: geom.vertices[2].length/3
            },
            {
                id: texVertBuf,
                type: gl.FLOAT,
                count: 2,
                stride: 2 * Float32Array.BYTES_PER_ELEMENT,
                name: "vert2d",
                nvertices: 4
            },
            {
                id: texCoordsBuf,
                type: gl.FLOAT,
                count: 2,
                stride: 2 * Float32Array.BYTES_PER_ELEMENT,
                name: "texCoords",
                nvertices: 4
            }],
        
        colorTexture: colorTexture
    };
}


// this is generic, it should be in a utility script
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
    var vao = gl.createVertexArray();
    var vaoi = gl.createVertexArray();
    var vaoTex = gl.createVertexArray();
    const program = programs[0];
    const programTex = programs[1];
    const programi = programs[2];
    
    gl.bindVertexArray(vao);
    bindBuffer(gl, buffers.arrayBuffers[0], program) // vertices0
    bindBuffer(gl, buffers.arrayBuffers[1], program) // vertices1
    bindBuffer(gl, buffers.arrayBuffers[2], program) // vertices2

    gl.bindVertexArray(vaoi);
    bindBuffer(gl, buffers.arrayBuffers[0], program) // vertices0
    
    gl.bindVertexArray(vaoTex);
    bindBuffer(gl, buffers.arrayBuffers[3], programTex) // tex vertices
    bindBuffer(gl, buffers.arrayBuffers[4], programTex) // tex coords
    gl.bindVertexArray(null);

    batches.push(
        {
            update: (gl) => {},
            render: (gl, context) => {
                gl.bindVertexArray(vaoi);

                /*var framebuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, buffers.colorTexture, 0);*/
                gl.enable(gl.DEPTH_TEST);
                gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
                gl.useProgram(programi);
                var matrixLocation = gl.getUniformLocation(programi, 'modelViewProjection');
                gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(context.camera));

                gl.drawArrays(gl.TRIANGLES, 0, buffers.arrayBuffers[0].nvertices);

                gl.readPixels(0, 0, 512, 512, gl.RGBA, gl.UNSIGNED_BYTE, depthSurface);
                gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
                
                /*gl.bindVertexArray(vao);
                gl.useProgram(program);
                gl.enable(gl.DEPTH_TEST);
                gl.clear(gl.DEPTH_BUFFER_BIT);
                gl.useProgram(program);
                var matrixLocation = gl.getUniformLocation(program, 'modelViewProjection');
                gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(context.camera));
                
                var normalLocation = gl.getUniformLocation(program, 'normalMatrix');
                gl.uniformMatrix4fv(normalLocation, false, getNormalMatrix(context.camera));
                
                var intLocation = gl.getUniformLocation(program, "mouseIntersection");
                
                var intPoint = [];
                if (context.intersectionPoint == null)
                    intPoint = [0,0,0,0];
                else
                    intPoint = [context.intersectionPoint[0],
                                context.intersectionPoint[1],
                                context.intersectionPoint[2],
                                1];
                gl.uniform4fv(intLocation, intPoint);
                gl.drawArrays(gl.LINES, 0, buffers.arrayBuffers[0].nvertices);
                */
                
                const error = gl.getError();
                if (error !== gl.NO_ERROR) console.log(error);
                gl.bindVertexArray(null);
                gl.useProgram(null);
            }
        });
    return batches;
}
