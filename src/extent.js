define(function(){
    var smallest = -Math.pow(2, 128);
    return function stats(fxgl) {
        var fieldCount = fxgl.uniform.uFieldCount.data;
        fxgl.framebuffer("fStats", "float", [2, fieldCount]);

        var vs = fxgl.shader.vertex(function(){
            gl_PointSize = 1.0;
            var i, j;
            if(this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
                this.vDiscardData = 1.0;
            } else {
                this.vDiscardData = 0.0;
                i = (this.aDataIdx+0.5) / this.uDataDim.x;
                j = (this.aDataIdy+0.5) / this.uDataDim.y;
                this.vResult = this.getData(this.uFieldId, i, j);
            }
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        });

        var fs = fxgl.shader.fragment(function() {
            if(this.vDiscardData == 1.0) discard;
            if(this.vResult >= 0.0)
                gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
            else
                gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
        });

        var gl = fxgl.program("stats", vs, fs);

        return function(fieldIds, dataDimension) {
            if(!fxgl._update)
                fxgl.framebuffer("fStats", "float", [2, fieldIds.length]);
            var gl = fxgl.program("stats");
            fxgl.framebuffer.enableRead("fGroupResults");

            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdx.location, 0);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValx.location, 0);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdy.location, 1);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValy.location, 1);

            fxgl.bindFramebuffer("fStats");
            gl.clearColor( smallest, smallest, smallest, smallest );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            // gl.finish();
            // fxgl.uniform.uDeriveCount = deriveFieldCount;
            var extents = new Array(fieldIds.length);

            var start = new Date();
            var idCount = fxgl.uniform.uIndexCount.data;
            console.log('resultDimension:::::::::::::::::::::::::::::', dataDimension, idCount, fieldIds );

            fieldIds.forEach(function(d, i){
                fxgl.uniform.uFieldId = i+idCount;

                gl.viewport(0, i, 1,  1);
                gl.blendEquation(gl.MAX_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

                gl.viewport(1, i, 1,  1);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

                gl.blendEquation(gl.MIN_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

                // var extent = new Float32Array(8);
                // gl.readPixels(0, i, 2, 1, gl.RGBA, gl.FLOAT, extent);
                // console.log(extent);
                // var ext = extent;
                // var minValue = (ext[0] > 0) ? ext[1] : ext[7],
                //     maxValue = (ext[2] > 0) ? ext[3] : ext[5];
                //  extents[i] = [minValue, maxValue];
            });

            var extent = new Float32Array(8 * fieldIds.length);
            gl.readPixels(0, 0, 2, fieldIds.length, gl.RGBA, gl.FLOAT, extent);

            fieldIds.forEach(function(d, i){
                var ext = extent.slice(i*8, i*8+8);
                var minValue = (ext[4] < 0) ? ext[5] : ext[7],
                    maxValue = (ext[2] > 0) ? ext[3] : ext[1];
                 extents[i] = [minValue, maxValue];
             });

             console.log(extent);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return extents;
        }

    }
})
