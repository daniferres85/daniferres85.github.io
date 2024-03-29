window.addEventListener("load", ev => {
    const canvas = document.getElementById("myCanvas");
    canvas.width = 512, canvas.height = 512;
    const gl = canvas.getContext("webgl2", {preserveDrawingBuffer: true});

    // Global state for the camera interaction
    var mouseIsDown = false;
    var shiftPressed = false;
    var actionPressed = false;
    var intersectionPoint = [];
    var intersectionPointFun;
    var boundingSphereFun;
    var camera;


    // Reset the camera to view the whole model
    function initializeCamera() {
        if (boundingSphereFun != null)
        {

            // The eye needs to be so far away that with a given Fov we can see the bounding sphere
            var fovDeg = 15;
            var fovRad = Math.PI * fovDeg / 180;
            boundingSphere = boundingSphereFun();
            var dEye = boundingSphere.radius/(Math.tan(fovRad/2));
            var eye = [];
            vec3.add(eye, boundingSphere.center, [0,0,dEye]);
            return {
                eye : eye,
                target : boundingSphere.center,
                up: [0,1,0],
                projection : {
                    fovRad: fovRad,
                    near: 0.01,
                    far: 10
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
        else if (ev.code == 'ShiftLeft')
        {
            shiftPressed = true;
        }
    });

    document.addEventListener('keyup', ev => {
        if (ev.code == 'KeyA')
        {
            actionPressed = false;
        }
        else if (ev.code == 'ShiftLeft')
        {
            shiftPressed = false;
        }
    });

    
    canvas.addEventListener('wheel', (e) => {
        if (e.deltaY > 0)
        {
            camera.projection.fovRad *= 1.1;
        }
        else
        {
            camera.projection.fovRad /= 1.1;
        }
        camera.projection.fovRad = Math.max(0.01, Math.min(Math.PI, camera.projection.fovRad));
    }); 

    canvas.addEventListener('mousedown', ev => {
        mouseIsDown = true;
    });
    
    window.addEventListener('mouseup', ev => {
        mouseIsDown = false;
    });
    
    canvas.addEventListener('mousemove', ev => {
        
        if (mouseIsDown && !actionPressed && !shiftPressed)
        {
            // Rotation, the pivot point is the camera.target
            // increment in X means a negative rotation along the up vector
            // increment in y means a negative rotation along the right
            var bb = getBillboardVectors(camera);
            var angleUp = -2 * Math.PI * ev.movementX / canvas.width;
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
        else if (shiftPressed && mouseIsDown)
        {
            // Pan, move the eye and the target proportionally to the frustum extents
            // in the model center
            
            var targetToEye = getTargetToEye(camera);
            var targetToEyeLength = vec3.length(targetToEye);
            
            var bb = getBillboardVectors(camera);
            var frustum = getFrustumAtDepth(camera, targetToEyeLength);
            
            var hSpan = frustum.right - frustum.left;
            var vSpan = frustum.top - frustum.bottom;
            
            var deltaH = hSpan * event.movementX/canvas.width;
            var deltaV = vSpan * event.movementY/canvas.height;
            camera.eye = [
                camera.eye[0] - bb.right[0] * deltaH + bb.up[0] * deltaV,
                camera.eye[1] - bb.right[1] * deltaH + bb.up[1] * deltaV,
                camera.eye[2] - bb.right[2] * deltaH + bb.up[2] * deltaV];
            camera.target = [
                camera.target[0] - bb.right[0] * deltaH + bb.up[0] * deltaV,
                camera.target[1] - bb.right[1] * deltaH + bb.up[1] * deltaV,
                camera.target[2] - bb.right[2] * deltaH + bb.up[2] * deltaV];
        }
        else if (intersectionPointFun)
        {
            intersectionPoint = intersectionPointFun([ev.offsetX, ev.offsetY], camera, [canvas.width, canvas.height]);
            console.log(intersectionPoint);
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
                                          action: actionPressed & mouseIsDown & !shiftPressed
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

    // Prepare the vertices/indices
    var geometry = createGeometry();

    // Setup the functions required by the camera
    intersectionPointFun = geometry.intersectionPointFun;
    boundingSphereFun = geometry.boundingSphereFun;

    // create buffers, then shaders, then batches ... then render
    // a batch is 'something' needed for render, it can be an object with shaders and Vaos and buffers
    // setup for rendering
    // a batch knows how to update itself and render itself
    
    var buffers = createBuffers(gl, geometry);

    createShaders(gl).then(shaders => {
        return createBatches(gl, shaders, buffers);
    }).then( batches => {
        camera = initializeCamera();
        startRendering(batches);
    });
    
});
