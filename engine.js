window.addEventListener("load", ev => {
    const canvas = document.getElementById("myCanvas");
    canvas.width = 512, canvas.height = 512;
    const gl = canvas.getContext("webgl2");
    
    var mouseIsDown = false;
    var actionPressed = false;
    var intersectionPoint = [];
    var intersectionPointFun;
    var boundingSphereFun;
    var camera;
    
    function initializeCamera() {
        if (boundingSphereFun != null)
        {
            var fovDeg = 15;
            var fovRad = Math.PI * fovDeg / 180;
            boundingSphere = boundingSphereFun();
            var dEye = boundingSphere.radius/(Math.tan(fovRad/2));
            var eye = [];
            vec3.add(eye, boundingSphere.center, [0,0,dEye]);
            console.log([fovRad, dEye, boundingSphere.center, eye]);
            return {
                eye : eye,
                target : boundingSphere.center,
                up: [0,1,0],
                projection : {
                    fovRad: fovRad,
                    near: 0.01,
                    far: 10000
                }
            };
        }
    }

    document.addEventListener('keypress', ev => {
        if (ev.code == 'KeyF')
        {
            camera = initializeCamera();
        }
    });
    
    document.addEventListener('keydown', ev => {
        if (ev.code == 'KeyA')
        {
            actionPressed = true;
        }
    });

    document.addEventListener('keyup', ev => {
        if (ev.code == 'KeyA')
        {
            actionPressed = false;
        }
    });

    
    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0)
        {
            camera.projection.fovRad /= 1.1;
        }
        else
        {
            camera.projection.fovRad *= 1.1;
        }
    }); 

    canvas.addEventListener('mousedown', ev => {
        mouseIsDown = true;
    });
    
    window.addEventListener('mouseup', ev => {
        mouseIsDown = false;
    });
    canvas.addEventListener('mousemove', ev => {
        
        if (mouseIsDown && !actionPressed)
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
        else
        {
            if (intersectionPointFun)
            {
                //intersectionPoint = get3dIntersection(vertices, indices, [ev.offsetX, ev.offsetY], camera, [512,512]);
                intersectionPoint = intersectionPointFun([ev.offsetX, ev.offsetY], camera, [canvas.width   , canvas.height]);
            }
        }
    });

    var pingPong = 0;
    const renderCycle = (batches) =>
    {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.5,0.5,0.5,1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        batches.forEach(b => b.update(gl));
        batches.forEach(b => b.render(gl,
                                      {
                                          camera: camera,
                                          intersectionPoint : intersectionPoint,
                                          pingPong : pingPong,
                                          action: actionPressed & mouseIsDown
                                      }));
        pingPong = (pingPong + 1)%2;
    }
    
    const startRendering = (batches) => {
        (function loop(count) {
            requestAnimationFrame(() => {
                renderCycle(batches);
                setTimeout(loop, 30, (count + 1) & 0x7fffffff);
            });
        })(0);
    };
    
    var geometry = createGeometry();

    intersectionPointFun = geometry.intersectionPointFun;
    boundingSphereFun = geometry.boundingSphereFun;

    var buffers = createBuffers(gl, geometry);

    createShaders(gl).then(shaders => {
        return createBatches(gl, shaders, buffers);
    }).then( batches => {
        camera = initializeCamera();
        startRendering(batches);
    });
    
});
