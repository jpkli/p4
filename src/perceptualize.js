define(function(require){
    var arrays = require("p4/core/arrays");

    return function perceptual(fxgl) {

        var viewport = fxgl.viewport,
            padding = fxgl.padding;

        var aViewX = arrays.seq(0, fxgl.viewport[0]-1);
        var aViewY = arrays.seq(0, fxgl.viewport[1]-1);

        fxgl.attribute("aViewX", "float", new Float32Array(aViewX))
            .attribute("aViewY", "float", new Float32Array(aViewY));

        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewX.location, 0);
        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewY.location, 1);

        fxgl.framebuffer("offScreenFBO", "float", fxgl.viewport)
            .framebuffer("visStats", "float", [1, 1]);

        var vs = fxgl.shader.vertex(function(){
            var i, j;
            i = (this.aViewX+0.5) / this.uViewDim.x;
            j = (this.aViewY+0.5) / this.uViewDim.y;
            this.vColorRGBA = texture2D(this.offScreenFBO, vec2(i, j));
            gl_Position = vec4(0.5, 0.5, 0.0, 1.0);
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
            $vec4(value);
            x = (gl_FragCoord.x) / this.uViewDim.x;
            y = (gl_FragCoord.y) / this.uViewDim.y;
            value = texture2D(this.offScreenFBO, vec2(x, y));

            if(value.a == 0.0) discard;
            a = pow(((value.a - this.uDefaultAlpha) / (this.uMaxRGBA.a -this.uDefaultAlpha)), 0.33) * 0.85 + 0.15;
            // a = value.a / this.uMaxRGBA.a;

            gl_FragColor = vec4(value.rgb, a);
            // gl_FragColor = vec4(texture2D(this.tColorGraident, vec2(a, 1.0)).rgb, a+0.2);

        });

        fxgl.program("vis-render", vs2, fs2);

        return function(viewDim) {

            var gl = fxgl.program("post-processing");
            fxgl.framebuffer.enableRead("offScreenFBO");
            fxgl.bindFramebuffer("visStats");
            gl.viewport(0, 0, 1, 1);
            fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewX.location, 0);
            fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aViewY.location, 1);
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.blendEquation(gl.MAX_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0,  viewDim[0], viewDim[1]);

            var max = new Float32Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);
            fxgl.uniform.uMaxRGBA = max;

            gl = fxgl.program("vis-render");
            fxgl.framebuffer.enableRead("offScreenFBO");
            fxgl.bindFramebuffer(null);

            gl.viewport(0, 0, viewDim[0], viewDim[1]);
            gl.disable( gl.BLEND );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.blendEquation(gl.FUNC_ADD);

        }

    }
});
