define(function(require){

    return function group(fxgl) {
        var group = {},
            aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];

        fxgl.uniform('uGroupGetStat', 'float', 0.0)
            .uniform('uAggrOpt', 'int', 2);

        function vsGroupByAggregation(){
            gl_PointSize = 1.0;

            var i, j, k;
            var x, groupKeyValue;

            i = (this.aIndex0+0.5) / this.uDataDim.x;
            j = (this.aIndex1+0.5) / this.uDataDim.y;
            this.vResult = this.getData(this.uFieldId, i, j);

            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            $vec2(pos);
            for ($int(ii) = 0; ii < 2; ii++) {
                $int(gid);
                gid = this.uGroupFields[ii];
                if(gid != -1) {
                    if(this.uIndexCount > 0) {
                        if(gid == 0) {
                            groupKeyValue = i;
                        } else if(gid == 1) {
                            groupKeyValue = j;
                        }
                    }
                    if(this.uIndexCount == 0 || gid > 1) {
                        $vec2(d);
                        d = this.getFieldDomain(gid);
                        groupKeyValue = (this.getData(gid, i, j) - d.x) / (d.y - d.x) * (this.getFieldWidth(gid)) / (this.getFieldWidth(gid)+1.);
                        groupKeyValue += 0.5/this.getFieldWidth(gid);
                    }
                    pos[ii] = groupKeyValue * 2.0 - 1.0;
                } else {
                    pos[ii] = 0.5;
                }
            }

            gl_Position = vec4(pos, 0.0, 1.0);
        }

        function fsWriteGroupResult() {
            if(this.vResult == 0.0) discard;

            if(this.uAggrOpt == 2)
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            else
                gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        }

        var vs = fxgl.shader.vertex(vsGroupByAggregation),
            fs = fxgl.shader.fragment(fsWriteGroupResult);

        fxgl.program("group", vs, fs);

        var vs2 = fxgl.shader.vertex(function() {
             gl_Position = vec4(this._square, 0, 1);
        });

        var fs2 = fxgl.shader.fragment(function() {
            var x, y, res;
            $vec4(value);
            x = (gl_FragCoord.x) / this.uResultDim.x;
            y = (gl_FragCoord.y) / this.uResultDim.y;
            y = (float(this.uFieldId - this.uIndexCount) + y) / float(this.uFieldCount);
            value = texture2D(this.uDataInput, vec2(x, y));
            if(this.uAggrOpt > 3)
                res = value.a / value.b;
            else
                res = value.a;
            gl_FragColor = vec4(0.0, 0.0, 0.0, res);
        });

        fxgl.program("group2", vs2, fs2);

        var resultFieldCount;

        group.execute = function(opts, groupFieldIds, resultFieldIds, dataDim, resultDim) {
            dataDimension = dataDim;
            resultDimension = resultDim;
            resultFieldCount = resultFieldIds.length;
            var gl = fxgl.program("group");
            fxgl.bindFramebuffer("fGroupResults");
            fxgl.framebuffer.enableRead("fDerivedValues");
            fxgl.framebuffer.enableRead("fFilterResults");
            fxgl.uniform.uGroupFields = groupFieldIds;
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.FUNC_ADD);
            fxgl.uniform.uGroupGetStat = 0.0;
            var resultDomains = new Array(resultFieldIds.length);
            fxgl.uniform.uResultDim = resultDim;
            var secondPass = false,
                thirdPass = false;
            resultFieldIds.forEach(function(f, i){
                var opt = aggrOpts.indexOf(opts[i]);
                if(opt == -1) throw Error("unknow operator for aggreation: " + opts[i]);
                gl.viewport(0, i*resultDimension[1], resultDimension[0], resultDimension[1]);
                if(opt == 0) gl.blendEquation(gl.MIN_EXT);
                else if(opt == 1) gl.blendEquation(gl.MAX_EXT);
                else gl.blendEquation(gl.FUNC_ADD);
                fxgl.uniform.uFieldId = f;
                fxgl.uniform.uAggrOpt = opt;
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                if(opt > 3) {
                    secondPass = true;
                    if(opt > 4) thirdPass = true;
                }
            });

            if(secondPass) {
                console.log('*** Second Pass for Aggregation');
                var fieldCount = fxgl.uniform.uFieldCount.data,
                    preAggrData = fxgl.uniform.uDataInput.data;

                fxgl.uniform.uDataInput.data = fxgl.framebuffer.fGroupResults.texture;
                fxgl.uniform.uFieldCount.data = resultFieldIds.length;

                if(thirdPass){
                    fxgl.framebuffer(
                        "fAggrStats",
                        "float", [resultDimension[0], resultDimension[1] * resultFieldIds.length]
                    );
                    fxgl.bindFramebuffer("fAggrStats");
                } else {
                    fxgl.framebuffer(
                        "fGroupResults",
                        "float",
                        [resultDimension[0], resultDimension[1] * resultFieldIds.length]
                    );
                    fxgl.bindFramebuffer("fGroupResults");
                }

                gl = fxgl.program("group2");
                gl.disable( gl.BLEND );
                resultFieldIds.forEach(function(f, i){
                    var opt = aggrOpts.indexOf(opts[i]);
                    fxgl.uniform.uAggrOpt = opt;
                    fxgl.uniform.uFieldId = i;
                    gl.viewport(0, i*resultDimension[1], resultDimension[0], resultDimension[1]);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                })

                if(thirdPass) {

                }
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        group.result =  function() {

            fxgl.bindFramebuffer("fGroupResults");
            var gl = fxgl.program("group"),
                result = new Float32Array(resultDimension[0]*resultDimension[1]*4*resultFieldCount);

            gl.readPixels(0, 0, resultDimension[0], resultDimension[1]*resultFieldCount, gl.RGBA, gl.FLOAT, result);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return result.filter(function(d, i){ return i%4===3;} );
        }

        return group;
    }
});
