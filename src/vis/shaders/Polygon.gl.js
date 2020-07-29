import Renderer from './Renderer.gl'

export default class Polygon extends Renderer{
  constructor (arg) {
    super(arg);
  }

  vertexShader () {
    var i, j;
    var rgb = new Vec3();
    var posX, posY, color, alpha, width, height, size;
    i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
    j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

    this.vResult = this.uVisLevel;

    if (this.uFilterFlag == 1) {
      this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
    }
    var val0, val1;
    val0 = this.aDataItemVal0;
    val1 = this.aDataItemVal1;
    posX = this.visMap(0, i, j, val0, val1, 0.0);
    posY = this.visMap(1, i, j, val0, val1, 0.0);
    color = this.visMap(2, i, j, val0, val1, -1.0);
    alpha = this.visMap(3, i, j, val0, val1, this.uDefaultAlpha);
    width = this.visMap(4, i, j, val0, val1, this.uDefaultWidth);
    height = this.visMap(5, i, j, val0, val1, this.uDefaultHeight);
    size = this.visMap(6, i, j, val0, val1, this.uMarkSize);
    posX = posX * (this.uFieldWidths[this.uVisualEncodings[0]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[0]];
    posY = posY * (this.uFieldWidths[this.uVisualEncodings[1]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[1]];

    width *= 1.0 - this.uMarkSpace.x;
    height *= 1.0 - this.uMarkSpace.y;
    posX += this.uMarkSpace.x * 0.5 * width;
    posY += this.uMarkSpace.y * 0.5 * height;

    if (this.aVertexId == 0.0 || this.aVertexId == 3.0) {
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    } else if (this.aVertexId == 1.0) {
      posX = posX * 2.0 - 1.0;
      posY = (posY + height) * 2.0 - 1.0;
    } else if (this.aVertexId == 2.0 || this.aVertexId == 5.0) {
      posX = (posX + width) * 2.0 - 1.0;
      posY = (posY + height) * 2.0 - 1.0;
    } else if (this.aVertexId == 4.0) {
      posX = (posX + width) * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    } else {
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    }

    rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
    if (this.uDropZeros == 1 && color == 0.0) {
      alpha = 0.0;
    }
    this.vColorRGBA = vec4(rgb * alpha, alpha);
    gl_Position = vec4(posX, posY, 0.0, 1.0);
  }

  fragmentShader() {
    if (this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01)
      gl_FragColor = this.vColorRGBA;
    else
      discard;
  }

  render() {
    let $p = this.gl;
    let primitive = $p.ctx.TRIANGLES;
    let val0 = new Float32Array($p.dataSize);
    let val1 = new Float32Array($p.dataSize);
    for(var y = 0; y < $p.dataDimension[1]; y++) {
      for(var x = 0; x < $p.dataDimension[0]; x++) {
        val0[y*$p.dataDimension[0] + x] = $p.attribute.aDataValx.data[x];
        val1[y*$p.dataDimension[0] + x] = $p.attribute.aDataValy.data[y];
      }
    }
    $p.attribute.aDataItemVal0 = val0;
    $p.attribute.aDataItemVal1 = val1;
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal0.location, 1);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal1.location, 1);
    $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, 6, $p.dataSize);
  }
}