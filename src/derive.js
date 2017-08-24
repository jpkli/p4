define(function(){
    return function optDerive(fxgl,fields,spec) {

        var derive = {},
            dataDimension = fxgl.uniform.uDataDim.data,
            deriveMax = fxgl.uniform.uDeriveCount.data,
            deriveFields = Object.keys(spec);

        var marco = "\t";

        deriveFields.forEach(function(d, i){
            var re = new RegExp("("+fields.join("|")+")","g");
            // var formula = spec[d].replace(/@([\w|\d|_]+)/g, function(matched){
            var formula = spec[d].replace(re, function(matched){
                // console.log(matched);
                var index = fields.indexOf(matched);
                return 'getData('  + index + ', pos.x, pos.y)';
            });
            marco += 'if (index == ' + i + ') return ' + formula + "; \n \telse ";
        });

        marco += " return 0.0;"

        // function getDataValue($int_field, $float_row, $float_col) {
        //     var pos, value;
        //     if(uIndexCount > 0 && field == 0) value = aIndex0Value;
        //     else if(uIndexCount > 0 && field == 1) value = aIndex1Value;
        //     else {
        //         pos = (float(field-uIndexCount) + col) / float(uFieldCount);
        //         value = texture2D(tData, vec2(row, pos)).a;
        //     }
        //     return value;
        // }

        fxgl.uniform("uOptMode", "float", 0)
            .uniform("uDeriveId", "int", 0)
            // .subroutine("getDataValue", "float", getDataValue)
            .subroutine("getDerivedValue", "float", new Function("$int_index", "$vec2_pos", marco));

        function vsDeriveStats(
            uOptMode, uDataDim, tData,
            aIndex0, aIndex1, aIndex0Value, aIndex1Value,  uIndexCount,
            uFieldCount, uDeriveId, uDeriveCount,
            vResult, fDerivedValues,
            getData, getDerivedValue
        ) {
            gl_PointSize = 1.0;

            var i, j;

            i = (aIndex0+0.5) / uDataDim.x;
            j = (aIndex1+0.5) / uDataDim.y;

            vResult = getDerivedValue(uDeriveId, vec2(i, j));
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    vResult = 0.0;
            }
            var x, y;
            if(uOptMode == 0.0){
                x = 0.5;
                y = 0.5;
            } else {
                x = i * 2.0 - 1.0;
                y = j * 2.0 - 1.0;
            }

            gl_Position = vec4(x, y, 0.0, 1.0);
        }

        function fsWriteDerivedValues(uOptMode, vResult) {
            if(vResult == 0.0) discard;
            if(uOptMode > 0.0 || vResult > 0.0)
                gl_FragColor = vec4(0.0, 0.0, 1.0, vResult);
            else
                gl_FragColor = vec4(1.0, vResult, 0.0, 0.0);
        }

        var vs = fxgl.shader.vertex(vsDeriveStats),
            fs = fxgl.shader.fragment(fsWriteDerivedValues),
            gl = fxgl.program("derive", vs, fs);

        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0Value.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1.location, 1);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1Value.location, 1);

        derive.execute = function() {

            var gl = fxgl.program("derive");
            fxgl.framebuffer.enableRead("fFilterResults");
            fxgl.bindFramebuffer("fDerivedValues");
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );

            // fxgl.uniform.uDeriveCount = deriveFieldCount;
            var deriveDomains = [];
            deriveFields.forEach(function(d, i){
                fxgl.uniform.uDeriveId = i;
                gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.viewport(0, 0, 1,  1);

                var min = new Float32Array(4),
                    max = new Float32Array(4);

                gl.blendEquation(gl.MAX_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

                gl.blendEquation(gl.MIN_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, min);

                var minValue = (max[0] > 0) ? max[1] : min[3],
                    maxValue = (max[2] > 0) ? max[3] : min[1];
                deriveDomains[i] = [minValue, maxValue];
                // deriveDomains[i] = [Math.min(min[0], min[3]), Math.max(max[0], max[3])];
            });
            gl.viewport(0, 0, dataDimension[0], dataDimension[1]*deriveMax);
            gl.disable( gl.BLEND );
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            console.log(deriveDomains[0]);
            fxgl.uniform.uOptMode = 1.0;

            deriveFields.forEach(function(d, i){
                fxgl.uniform.uDeriveId = i;
                gl.viewport(0, dataDimension[1]*i, dataDimension[0], dataDimension[1]);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return deriveDomains;
        }

        derive.result = function(deriveFieldId) {
            var fid = deriveFieldId || 0;
            var result = new Float32Array(dataDimension[0]*dataDimension[1]*4);
            gl.readPixels(0, dataDimension[1]*fid, dataDimension[0], dataDimension[1], gl.RGBA, gl.FLOAT, result);
            return result.filter(function(d, i){ return i%4===3;} ); //return channel alpha in rgba
        }

        return derive;

    }
})
