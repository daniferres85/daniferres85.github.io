/*camera has:
 - eye
 - target
 - up
 - projection
      - left,
      - right
      - bottom 
      - top
      - near
      - far*/

function getTargetToEye(cam)
{
    var vd = [];
    vec3.sub(vd, cam.eye, cam.target);
    return vd;
}

function getViewMatrix(cam)
{
    var vm = [];
    mat4.lookAt(vm, cam.eye, cam.target, cam.up);
    return vm;
}

function getBillboardVectors(cam)
{
    var vm = getViewMatrix(cam);
    var bb = {
        right: [vm[0], vm[4], vm[8]],
        up: [vm[1], vm[5], vm[9]]};
    return bb;
}

function getProjectionMatrix(cam)
{
    var res = [];
    mat4.ortho(res,
               cam.projection.left,
               cam.projection.right,
               cam.projection.bottom,
               cam.projection.top,
               cam.projection.near,
               cam.projection.far);
    return res;
}

function getViewProjection(cam)
{
    var v = getViewMatrix(cam);
    var p = getProjectionMatrix(cam);
    var vp = [];
    mat4.mul(vp, p, v);
    return vp;
}

function getNormalMatrix(cam)
{
    var v = getViewMatrix(cam);
    var vi = [];
    mat4.invert(vi, v);
    var vit = [];
    mat4.transpose(vit, vi);
    return vit;
}
