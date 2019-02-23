export default class Gpgpu {
  constructor({context, name}) {
    this.gl = context;
    this.name = name;
    this.gl.program(
      name,
      this.gl.shader.vertex(this.vertexShader),
      this.gl.shader.fragment(this.fragmentShader)
    )
  }

  vertexShader () {
    gl_Position = vec4(this._square, 0, 1);
  }

  fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
  }

  load () {
    return this.gl.program(this.name);
  }

  render () {
    let gl = this.gl.ctx;
    gl.disable( gl.BLEND );
    gl.drawArrays(primitive || gl.TRIANGLES, 0, 6);
  }
}
