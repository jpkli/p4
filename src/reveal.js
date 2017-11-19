define(function(require){
    var arrays = require("./arrays");

    return function perceptual(fxgl) {
        var viewport = fxgl.viewport,
            padding = fxgl.padding;

        fxgl.uniform('uRevealMode', 'int', 1)
            .framebuffer("offScreenFBO", "float", fxgl.viewport)
            .framebuffer("visStats", "float", [1, 1]);

        var aViewX = new Float32Array(fxgl.viewport[0]).map((d, i) => i);
        var aViewY = new Float32Array(fxgl.viewport[1]).map((d, i) => i);

        fxgl.attribute("aViewX", "float", aViewX)
            .attribute("aViewY", "float", aViewY);

        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewX.location, 0);
        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewY.location, 1);

        var vs = fxgl.shader.vertex(function(){
            var i, j;
            i = (this.aViewX+0.5) / this.uViewDim.x;
            j = (this.aViewY+0.5) / this.uViewDim.y;
            this.vColorRGBA = texture2D(this.offScreenFBO, vec2(i, j));
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        });

        var fs = fxgl.shader.fragment(function() {
            gl_FragColor = this.vColorRGBA;
        });

        fxgl.program("post-processing", vs, fs);

        var vs2 = fxgl.shader.vertex(function () {
             gl_Position = vec4(this._square, 0, 1);
        });

        var fs2 = fxgl.shader.fragment(function() {
            var x, y, a;
            var value = new Vec4();
            x = (gl_FragCoord.x+0.5) / this.uViewDim.x;
            y = (gl_FragCoord.y+0.5) / this.uViewDim.y;
            value = texture2D(this.offScreenFBO, vec2(x, y));

            if(value.a == 0.0) discard;
            // a = pow(((value.a - this.uDefaultAlpha) / (this.uMaxRGBA.a -this.uDefaultAlpha)), 0.33) * 0.85 + 0.15;
            a = pow((value.a / this.uMaxRGBA.a), 0.33) * 0.9 + 0.1;
            // a = value.a / this.uMaxRGBA.a;

            if(this.uRevealMode == 0)
                gl_FragColor = vec4(this.uDefaultColor*a, a);
            else
                gl_FragColor = vec4(texture2D(this.tColorGraident, vec2(1.-a, 1.0)).rgb*this.uDefaultAlpha, this.uDefaultAlpha);
        });

        fxgl.program("vis-render", vs2, fs2);

        return function(viewDim) {
            var gl;
            if(!fxgl._update) {
                fxgl.framebuffer("visStats", "float", [1, 1]);

                gl = fxgl.program("post-processing");
                fxgl.framebuffer.enableRead("offScreenFBO");
                fxgl.bindFramebuffer("visStats");

                fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewX.location, 0);
                fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewY.location, 1);
                gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.disable(gl.CULL_FACE);
                gl.disable(gl.DEPTH_TEST);
                gl.enable( gl.BLEND );
                gl.blendFunc( gl.ONE, gl.ONE );
                gl.blendEquation(gl.MAX_EXT);
                gl.viewport(0, 0, 1, 1);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0,  viewDim[0], viewDim[1]);

                var max = new Float32Array(4);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);
                if(max[3] == 0) {
                    max[3] = Math.sqrt(fxgl.dataSize) * Math.log2(fxgl.dataSize);
                }
                fxgl.uniform.uMaxRGBA = max;
                console.log('reveal post-processing, max = ', max);
            }
            fxgl.bindFramebuffer(null);
            gl = fxgl.program("vis-render");
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute._square.location, 0);
            fxgl.framebuffer.enableRead("offScreenFBO");
            // fxgl.bindFramebuffer(null);

            gl.viewport(0, 0, viewDim[0], viewDim[1]);
            // gl.blendEquation(gl.FUNC_ADD);
            gl.disable( gl.BLEND );
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            // gl.blendEquation(gl.FUNC_ADD);
        }
    }
});
