window.addEventListener("load", ev => {

    const canvas = document.getElementById("myCanvas");
    canvas.width = 512, canvas.height = 512;
    const gl = canvas.getContext("webgl2");
    
    
    //?appendchild?

    var mouseIsDown = false;
    var intersectionPoint = [];
    var intersectionPointFun;
    var boundingSphereFun;
    var camera;
    
    function initializeCamera() {
        if (boundingSphereFun != null)
        {
            boundingSphere = boundingSphereFun();

            return {
                eye : [boundingSphere.center[0],
                       boundingSphere.center[1],
                       boundingSphere.center[2] + boundingSphere.radius],
                target : boundingSphere.center,
                up: [0,1,0],
                projection : {
                    left: -boundingSphere.radius,
                    right: boundingSphere.radius,
                    bottom: -boundingSphere.radius,
                    top: boundingSphere.radius,
                    near: 0.01,
                    far: 1000
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
        else
        {
            if (intersectionPointFun)
            {
                //intersectionPoint = get3dIntersection(vertices, indices, [ev.offsetX, ev.offsetY], camera, [512,512]);
                intersectionPoint = intersectionPointFun([ev.offsetX, ev.offsetY], camera, [512,512]);
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
                                          pingPong : pingPong
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
