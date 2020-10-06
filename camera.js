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
        up: [vm[1], vm[5], vm[9]],
        viewDir : [vm[2], vm[6], vm[10]]};
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

function calcRay(u, v, camera, viewport)
{
    var aspect = viewport[0]/viewport[1];
    var s = (u - 0.5) * aspect;
    var t = (v - 0.5);

    var bb = getBillboardVectors(camera);
    
    var eyeX = camera.eye[0] + bb.right[0] * s * (camera.projection.right - camera.projection.left) +
        bb.up[0] * t * (camera.projection.top - camera.projection.bottom);
    var eyeY = camera.eye[1] + bb.right[1] * s * (camera.projection.right - camera.projection.left) +
        bb.up[1] * t * (camera.projection.top - camera.projection.bottom);
    var eyeZ = camera.eye[2] + bb.right[2] * s * (camera.projection.right - camera.projection.left) +
        bb.up[2] * t * (camera.projection.top - camera.projection.bottom);
    
    var ray = {
        origin: [eyeX, eyeY, eyeZ],
        dir: [-bb.viewDir[0], -bb.viewDir[1], -bb.viewDir[2]]
    };
    return ray;
}

function rayTriangleIntersect(ray, v0, v1, v2)
{
    var edge1 = [];
    var edge2 = [];
    var pvec = [];
    var qvec = [];
    var tvec = [];
    var epsilon = 0.000001;
    vec3.sub(edge1, v1, v0);
    vec3.sub(edge2, v2, v0);
    vec3.cross(pvec, ray.dir, edge2);
    var det = vec3.dot(edge1, pvec);

    if (det > -epsilon && det < epsilon)
        return null;
    var invDet = 1/det;
    
    vec3.sub(tvec, ray.origin, v0);

    var u = vec3.dot(tvec, pvec) * invDet;
    if (u < 0 || u > 1)
        return null;
    vec3.cross(qvec, tvec, edge1);
    var v = vec3.dot(ray.dir, qvec) * invDet;
    if (v < 0 || u + v > 1)
        return null;
    var factor = vec3.dot(edge2, qvec) * invDet;
    var dt = [ray.dir[0] * factor, ray.dir[1] * factor, ray.dir[2] * factor];
    var result = [];
    vec3.add(result, ray.origin, dt);
    return result;
}

function get3dIntersection(vertices, indices, mousePos, camera, viewport)
{
    var u = mousePos[0]/viewport[0];
    var v = 1 - mousePos[1]/viewport[1];
    var ray = calcRay(u, v, camera, viewport);

    var resTmp = [];
    indices.forEach(idx => {
        var v0 = vertices[idx[0]];
        var v1 = vertices[idx[1]];
        var v2 = vertices[idx[2]];

        var result = rayTriangleIntersect(ray, v0, v1, v2);
        if (result != null)
        {
            resTmp.push(result);
        }
    });

    var nearestPoint = [];
    if (resTmp.length == 0)
        return null;

    var vp = getViewProjection(camera);
    var zmin = 100000000;
    var res = [];
    resTmp.forEach(r => {
        var ndc = [];
        vec3.transformMat4(ndc, r, vp);
        if (ndc[2] < zmin)
        {
            zmin = ndc[2];
            res = r;
        }
    });
    return res;
}
