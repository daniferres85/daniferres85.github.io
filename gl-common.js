const loadShader = (gl, src, type) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(src, gl.getShaderInfoLog(shader));
    }
    return shader;
};

const loadPrograms = (gl, shaderInfos) =>
      {
          var promises = [];
          shaderInfos.forEach(s =>
                              promises.push(loadProgram(gl, s.vertex, s.fragment, s.tfv)));
          return Promise.all(promises);
      };


const loadProgram = (gl, vertexFilename, fragmentFilename, tfv) => Promise.all([
    fetch(vertexFilename).then(res => res.text()).then(
        src => loadShader(gl, src, gl.VERTEX_SHADER)),
    fetch(fragmentFilename).then(res => res.text()).then(
        src => loadShader(gl, src, gl.FRAGMENT_SHADER))
]).then(shaders => {
    const program = gl.createProgram();
    shaders.forEach(shader => gl.attachShader(program, shader));

    if (tfv != null) {
        gl.transformFeedbackVaryings(
            program,
            tfv,
            gl.SEPARATE_ATTRIBS)
    }
    
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getProgramInfoLog(program));
    };
    return program;
});



