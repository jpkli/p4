import Renderer from './renderer.gl'

export default class Instanced extends Renderer{
    constructor(arg) {
        super(arg)        
    }

    vertexShader () {
        var i, j, posX, posY, color, alpha, size;
        var rgb = new Vec3();

        i = (this.aDataIdx + 0.5) / this.uDataDim.x;
        j = (this.aDataIdy + 0.5) / this.uDataDim.y;

        if (this.uFilterFlag == 1) {
            this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
        } else {
            this.vResult = this.uVisLevel;
        }

        posX = this.visMap(this.uVisualEncodings[0], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
        posY = this.visMap(this.uVisualEncodings[1], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
        color = this.visMap(this.uVisualEncodings[2], i, j, this.aDataValx, this.aDataValy, -1.0, 0.0);
        alpha = this.visMap(this.uVisualEncodings[3], i, j, this.aDataValx, this.aDataValy, this.uDefaultAlpha, 0.0);
        size = this.visMap(this.uVisualEncodings[6], i, j, this.aDataValx, this.aDataValy, 1.0, 0.0);
        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;

        rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
        gl_PointSize = size * this.uMarkSize;
        this.vColorRGBA = vec4(rgb, alpha);
        gl_Position = vec4(posX, posY, 0.0, 1.0);
    }

    fragmentShader() {
        var valid = new Bool();
        valid = this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01;
        if (this.uVisMark == 1) {
            var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
            if (dist > 0.5) discard;
            var delta = 0.15;
            var alpha = this.vColorRGBA.a - smoothstep(0.5 - delta, 0.5, dist);
            if (valid) {
                gl_FragColor = vec4(this.vColorRGBA.rgb * alpha, alpha);
            } else {
                discard;
            }
        } else {
            if (valid) {
                gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a, this.vColorRGBA.a);
            } else {
                discard;
            }
        }
    }

    render(primitive) {
        let $p = this.gl;
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);

    }
}