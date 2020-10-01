"use strict";

import {vertices, indices} from './bunny.js';
import {getBoundingBox, getBoundingSphere, getNormals} from './utils.js'


var mouseIsDown = false;
var camera = {
    eye : [],
    target : [],
    up : [],
    projection : {
        left : 0,
        right : 0,
        bottom : 0,
        top : 0,
        near : 0,
        far : 0
    }
};
var boundingSphere = {};

window.addEventListener("load", ev => {
    // webgl setup
    const canvas = document.getElementById("myCanvas");
    canvas.width = 512, canvas.height = 512;
    canvas.style.border = "solid";

    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0)
        {
            camera.projection.left *= 1.5;
            camera.projection.right *= 1.5;
            camera.projection.bottom *= 1.5;
            camera.projection.top *= 1.5;
        }
        else
        {
            camera.projection.left /= 1.5;
            camera.projection.right /= 1.5;
            camera.projection.bottom /= 1.5;
            camera.projection.top /= 1.5;
        }
    }); 

    canvas.addEventListener('mousedown', ev => {
        mouseIsDown = true;
    });
    
    window.addEventListener('mouseup', ev => {
        mouseIsDown = false;
    });
    canvas.addEventListener('mousemove', ev => {
        if (mouseIsDown)
        {
            var bb = getBillboardVectors(camera);
            // increment in X means a negative rotation along the up vector
            var angleUp = -2 * Math.PI * ev.movementX / canvas.width;
            // increment in y means a negative rotation along the right
            var angleRight = -2 * Math.PI * ev.movementY / canvas.height;

            var quatRight = [];
            var quatUp = [];
            quat.setAxisAngle(quatRight, bb.right, angleRight);
            quat.setAxisAngle(quatUp, bb.up, angleUp);

            var targetToEye = getTargetToEye(camera);
            var newTargetToEye0 = [], newTargetToEye1 = [];
            vec3.transformQuat(newTargetToEye0, targetToEye, quatRight);
            vec3.transformQuat(newTargetToEye1, newTargetToEye0, quatUp);

            var newUp0 = [];
            vec3.transformQuat(newUp0, camera.up, quatRight);
            vec3.transformQuat(camera.up, newUp0, quatUp);

            vec3.add(camera.eye, camera.target, newTargetToEye1);
        }
    });
    
    document.body.appendChild(canvas);

    const gl = canvas.getContext("webgl2");

    var normals = [];
    const setupGeometry = () => {
        boundingSphere = getBoundingSphere(vertices);
        normals = getNormals(vertices, indices);
        return indices.length * 3;
    };
    
    const setupVao = (program) => {
        const vert3dData = new Float32Array([].concat(...vertices));
        const vertBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
        gl.bufferData(gl.ARRAY_BUFFER, vert3dData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        const indexData = new Uint16Array([].concat(...indices));
        const indexBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        
        const normalData = new Float32Array([].concat(...normals));
        const normalBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
        gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        
        // opengl3 VAO
        const vertexArray = gl.createVertexArray();
        
        // setup buffers and attributes to the VAO
        gl.bindVertexArray(vertexArray);
        // bind buffer data
        gl.bindBuffer(gl.ARRAY_BUFFER, vertBuf);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
        
        // set attribute types
        const vert3dId = gl.getAttribLocation(program, "vert3d");
        const normalId = gl.getAttribLocation(program, "normal");

        const elem = gl.FLOAT, count = 3, normalize = false;
        const offset = 0, stride = count * Float32Array.BYTES_PER_ELEMENT;
        
        gl.enableVertexAttribArray(vert3dId);
        gl.vertexAttribPointer(
            vert3dId, count, elem, normalize, stride, offset);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuf);
        gl.enableVertexAttribArray(normalId);
        gl.vertexAttribPointer(
            normalId, count, elem, normalize, stride, offset);

        gl.bindVertexArray(null);
        var vaoAndProg = {
            prog : program,
            vao : vertexArray
        };
        return vaoAndProg;
    }
      
    

    // initialize data variables for the shader program
    const initializeCamera = () => {
        camera.projection.left = -boundingSphere.radius;
        camera.projection.right = boundingSphere.radius;
        camera.projection.bottom = -boundingSphere.radius;
        camera.projection.top = boundingSphere.radius;
        camera.projection.near = 0.01;
        camera.projection.far = 1000;
        
        camera.eye = [boundingSphere.center[0],
                      boundingSphere.center[1],
                      boundingSphere.center[2] + boundingSphere.radius];
        camera.target = boundingSphere.center;
        camera.up = [0,1,0];
    }

    document.addEventListener('keypress', ev => {
        if (ev.code == 'KeyF')
        {
            initializeCamera();
        }
    });
    

    const render = (vaoAndProg, nIndices, count) => {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.5,0.5,0.5,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(vaoAndProg.prog);
        
        var matrixLocation = gl.getUniformLocation(vaoAndProg.prog, 'modelViewProjection');
        gl.uniformMatrix4fv(matrixLocation, false, getViewProjection(camera));

        var matrixLocation = gl.getUniformLocation(vaoAndProg.prog, 'normalMatrix');
        gl.uniformMatrix4fv(matrixLocation, false, getNormalMatrix(camera));

        // draw the buffer with VAO
        // NOTE: binding vert and index buffer is not required
        gl.bindVertexArray(vaoAndProg.vao);

        gl.drawElements(gl.TRIANGLES, nIndices,
                        gl.UNSIGNED_SHORT, 0);
        const error = gl.getError();
        if (error !== gl.NO_ERROR) console.log(error);
        gl.bindVertexArray(null);
        gl.useProgram(null);
    };
    const startRendering = (vaoAndProg, nIndices) => {
        (function loop(count) {
            requestAnimationFrame(() => {
                render(vaoAndProg, nIndices, count);
                setTimeout(loop, 30, (count + 1) & 0x7fffffff);
            });
        })(0);
    };

    // (not used because of it runs forever)
    const cleanupResources = (program) => {
        gl.deleteBuffer(vertBuf);
        gl.deleteBuffer(normalBuf);
        gl.deleteBuffer(indexBuf);
        gl.deleteVertexArray(vertexArray);
        gl.deleteProgram(program);
    };
    
    var nIndices = setupGeometry();
    initializeCamera();
    loadProgram(gl, "./vertex.glsl", "./fragment.glsl").then(setupVao).then(vaoAndProg => startRendering(vaoAndProg, nIndices));
    
}, false);
