export const IntervalMatch = {
  vertexShader() {
    var i, j, k, value;
    var filter = new Int(0);
    var sel = new Int(0);
    var visSelect = new Bool(false);
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    
    for(var f = 0; f < $(fieldCount) + $(indexCount); f++) {
      if(this.uFilterControls[f] == 1 || this.uVisControls[f] == 1) {
        value = this.getData(f, i, j);
    
        if(this.uFilterControls[f] == 1) {
          if(value < this.uFilterRanges[f].x || value > this.uFilterRanges[f].y) {
            filter -= 1;
          }
        }
        if(this.uVisControls[f] == 1) {
          if(value < this.uVisRanges[f].x || value > this.uVisRanges[f].y) {
            sel -= 1;
          }
          visSelect = true;
        }
      }
    }
    this.vResult = 0.1;
    if(filter < 0) {
      this.vResult = 0.0;
    } else {
      if(visSelect)
        this.vResult = (sel < 0) ? 0.1 : 0.2;
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
  },

  fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
  }
}

export const DiscreteMatch = {
  vertexShader() {
    var i, j, k, value;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    this.vResult = this.uFilterLevel - 0.1;
    value = this.getData(this.uFieldId, i, j);
    for(var l = 0; l < 100; l++){
      if(l < this.uSelectCount) {
        if(value == this.uInSelections[l]) {
          this.vResult = this.uFilterLevel;
        }
      }
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
  },

  fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
  }
}