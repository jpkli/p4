define(function(){
    return function optDerive(context, spec) {

        var derive = {},
            dataDimension = context.uniform.uDataDim.data,
            deriveMax = context.uniform.uDeriveCount.data,
            deriveFields = Object.keys(spec);

        fields = context.fields;

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
        //     if(uIndexCount > 0 && field == 0) value = aDataValx;
        //     else if(uIndexCount > 0 && field == 1) value = aDataValy;
        //     else {
        //         pos = (float(field-uIndexCount) + col) / float(uFieldCount);
        //         value = texture2D(tData, vec2(row, pos)).a;
        //     }
        //     return value;
        // }

        context.uniform("uOptMode", "float", 0)
            .uniform("uDeriveId", "int", 0)
            // .subroutine("getDataValue", "float", getDataValue)
            .subroutine("getDerivedValue", "float", new Function("$int_index", "$vec2_pos", marco));




        function vertexShader(getData) {
            gl_PointSize = 1.0;

            var i, j;

            i = (this.aDataIdx+0.5) / this.uDataDim.x;
            j = (this.aDataIdy+0.5) / this.uDataDim.y;

            this.vResult = this.getDerivedValue(this.uDeriveId, vec2(i, j));
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }
            var x, y;
            if(this.uOptMode == 0.0){
                x = 0.5;
                y = 0.5;
            } else {
                x = i * 2.0 - 1.0;
                y = j * 2.0 - 1.0;
            }

            gl_Position = vec4(x, y, 0.0, 1.0);
        }

        function fragmentShader() {
            if(this.vResult == 0.0) discard;
            if(this.uOptMode > 0.0 || this.vResult >= 0.0)
                gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
            else
                gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
        }

        var vs = context.shader.vertex(vertexShader),
            fs = context.shader.fragment(fragmentShader),
            gl = context.program("derive", vs, fs);

        gl.ext.vertexAttribDivisorANGLE(context.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aDataValy.location, 1);

        function _execute() {

            var gl = context.program("derive");
            context.framebuffer.enableRead("fFilterResults");
            context.bindFramebuffer("fDerivedValues");
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );

            // context.uniform.uDeriveCount = deriveFieldCount;
            var deriveDomains = [];
            deriveFields.forEach(function(d, i){
                context.uniform.uDeriveId = i;
                gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.viewport(0, 0, 1,  1);

                var result = new Float32Array(8);

                gl.blendEquation(gl.MAX_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

                gl.viewport(1, 0, 1,  1);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

                gl.blendEquation(gl.MIN_EXT);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, result);

                var minValue = (result[4] < 0) ? result[5] : result[7],
                    maxValue = (result[2] > 0) ? result[3] : result[1];
                deriveDomains[i] = [minValue, maxValue];

                // deriveDomains[i] = [Math.min(min[0], min[3]), Math.max(max[0], max[3])];
            });
            gl.viewport(0, 0, dataDimension[0], dataDimension[1]*deriveMax);
            gl.disable( gl.BLEND );
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            context.uniform.uOptMode = 1.0;

            deriveFields.forEach(function(d, i){
                context.uniform.uDeriveId = i;
                gl.viewport(0, dataDimension[1]*i, dataDimension[0], dataDimension[1]);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            });

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return deriveDomains;
        }

        derive.execute = function(spec) {
            var deriveFields = Object.keys(spec);
            context.fields = context.fields.concat(deriveFields);
            var newDomains = _execute();
            if(!context._update) {
                newDomains.forEach(function(d, i) {
                    context.deriveDomains[context.deriveCount+i] = d;
                    context.deriveWidths[context.deriveCount+i] = d[1] - d[0] + 1;
                });
                context.deriveCount += deriveFields.length;
                // console.log(derive.result());
                getResult = derive.result;
                // console.log(context.deriveDomains, fields);

                context.uniform.uDeriveDomains.data = context.deriveDomains;
                context.uniform.uDeriveWidths.data = context.deriveWidths;
            }
        }

        derive.result = function(arg) {
            var options = arg || {},
                offset = options.offset || [0, 0],
                resultSize = options.size || context.dataDimension[0]* context.dataDimension[1],
                fid = options.fieldId || options.deriveFieldId || 0,
                rowSize = Math.min(resultSize, context.dataDimension[0]),
                colSize = Math.ceil(resultSize/context.dataDimension[0]);

            var result = new Float32Array(rowSize * colSize * 4);
            gl.readPixels(0, dataDimension[1]*fid, rowSize, colSize, gl.RGBA, gl.FLOAT, result);
            return result.filter(function(d, i){ return i%4===3;} ); //return channel alpha in rgba
        }

        return derive;

    }
})
