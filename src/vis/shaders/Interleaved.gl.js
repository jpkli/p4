import Renderer from './Renderer.gl'

export default class Instanced extends Renderer{
    constructor(arg) {
        super(arg)        
    }

    vertexShader () {
      var i, j;
      var rgb = new Vec3();
      var posX, posY, size, color, alpha;
      gl_PointSize = this.uMarkSize;
      i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
      j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;
  
      this.vResult = this.uVisLevel;
      if(this.uFilterFlag == 1) {
          this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
      }
      if(this.uInterleaveX == 1) {
          posX = this.aDataFieldId.y / float(this.uFeatureCount-1);
          posY = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
      } else {
          posY = 1.0 - this.aDataFieldId.y / float(this.uFeatureCount-1);
          posX = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
      }
      color = this.visMap(this.uVisualEncodings[2], i, j, i, j, -1.0,  0.0);
      alpha = this.visMap(this.uVisualEncodings[3], i, j, i, j, this.uDefaultAlpha, 0.0);
  
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
  
      rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
      this.vColorRGBA = vec4(rgb*alpha, alpha);
      gl_Position = vec4(posX, posY, 0.0, 1.0);
    }

    updateInstancedAttribute(vm) {
      let $p = this.gl;
      if(Array.isArray(vm)){
          let fv = new Float32Array(vm.length*2);
          vm.forEach(function(f, i) {
              fv[i*2] = $p.fields.indexOf(f);
              fv[i*2+1] = i;
          });
          $p.attribute.aDataFieldId = fv;
          $p.uniform.uFeatureCount = vm.length;
      }
    }

    render(primitive) {
      let $p = this.gl;
      $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
      $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
      let count = $p.attribute.aDataFieldId.data.length / $p.attribute.aDataFieldId.size;
      $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, count, $p.dataSize);
    }
}