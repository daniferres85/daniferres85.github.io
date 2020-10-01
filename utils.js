export function getBoundingBox(vertices3d)
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

export function calcModulus(vec3d)
{
    return Math.sqrt(vec3d[0] * vec3d[0] + vec3d[1] * vec3d[1] + vec3d[2] * vec3d[2]);
}
export function getBoundingSphere(vertices3d)
{
    const bbox = getBoundingBox(vertices3d);
    var center = bbox.center;
    var radius = calcModulus(bbox.extents);
    
    var bsphere = {
        center : center,
        radius : radius};
    
    return bsphere;
}

export function getNormals(vertices, indices)
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
