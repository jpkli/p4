define(function(require){
    const utils = require('./utils');
    const vecId = ['x', 'y', 'z'];
    const aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];
    return function aggregate($p) {
        var aggregate = {};

        $p.uniform('uGroupGetStat', 'float', 0.0)
            .uniform('uAggrOpt', 'int', 2);

        function vertexShader(){
            gl_PointSize = 1.0;

            var i, j, k;
            var x, groupKeyValue;

            i = (this.aDataIdx+0.5) / this.uDataDim.x;
            j = (this.aDataIdy+0.5) / this.uDataDim.y;
            this.vResult = this.getData(this.uFieldId, i, j);

            if(this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
                this.vResult = 0.0;
            }

            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            var pos = new Vec2();
            for (var ii = 0; ii < 2; ii++) {
                var gid = new Int();
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
                        var d = new Vec2();
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

        function fragmentShader() {
            if(this.vResult == 0.0) discard;

            if(this.uAggrOpt == 2)
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            else
                gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        }

        var vs = $p.shader.vertex(vertexShader),
            fs = $p.shader.fragment(fragmentShader);

        $p.program("group", vs, fs);

        var vs2 = $p.shader.vertex(function main() {
             gl_Position = vec4(this._square, 0, 1);
        });

        var fs2 = $p.shader.fragment(function () {
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

        $p.program("group2", vs2, fs2);

        var resultFieldCount,
            secondPass = false,
            thirdPass = false,
            resultDomains;

        function _execute(opts, groupFieldIds, resultFieldIds) {
            resultFieldCount = resultFieldIds.length;
            var gl = $p.program("group");
            $p.bindFramebuffer("fGroupResults");
            $p.framebuffer.enableRead("fDerivedValues");
            $p.framebuffer.enableRead("fFilterResults");

            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

            $p.uniform.uGroupFields = groupFieldIds;
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.FUNC_ADD);
            $p.uniform.uGroupGetStat = 0.0;
            var resultDomains = new Array(resultFieldIds.length);
            $p.uniform.uResultDim = $p.resultDimension;

            secondPass = false;
            thirdPass = false;
            resultFieldIds.forEach(function(f, i){
                var opt = aggrOpts.indexOf(opts[i]);
                if(opt == -1) throw Error("unknow operator for aggreation: " + opts[i]);
                gl.viewport(0, i*$p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
                if(opt == 0) gl.blendEquation(gl.MIN_EXT);
                else if(opt == 1) gl.blendEquation(gl.MAX_EXT);
                else gl.blendEquation(gl.FUNC_ADD);
                $p.uniform.uFieldId = f;
                $p.uniform.uAggrOpt = opt;
                gl.ext.drawArraysInstancedANGLE(
                    gl.POINTS, 0,
                    $p.dataDimension[0],
                    $p.dataDimension[1]
                );
                if(opt > 3) {
                    secondPass = true;
                    if(opt > 4) thirdPass = true;
                }
            });

            if(secondPass) {
                // console.log('*** Second Pass for Aggregation');
                var fieldCount = $p.uniform.uFieldCount.data,
                    preAggrData = $p.uniform.uDataInput.data;

                $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;
                $p.uniform.uFieldCount.data = resultFieldIds.length;

                if(thirdPass){
                    $p.framebuffer(
                        "fAggrStats",
                        "float", [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
                    );
                    $p.bindFramebuffer("fAggrStats");
                } else {
                    $p.framebuffer(
                        "fGroupResults",
                        "float",
                        [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
                    );
                    $p.bindFramebuffer("fGroupResults");
                }

                gl = $p.program("group2");
                gl.disable( gl.BLEND );
                resultFieldIds.forEach(function(f, i){
                    var opt = aggrOpts.indexOf(opts[i]);
                    $p.uniform.uAggrOpt = opt;
                    $p.uniform.uFieldId = i;
                    gl.viewport(0, i*$p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                })

            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        aggregate.execute = function(spec) {
            var groupFields = spec.$by || spec.$group,
                groupFieldIds = [-1, -1].
                resultDim = [1, 1];

            if(!Array.isArray(groupFields)) groupFields = [groupFields];
            if (groupFields.length == 2) {
                groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
                groupFieldIds[1] = $p.fields.indexOf(groupFields[1]);
                $p.resultDimension = [
                    $p.fieldWidths[groupFieldIds[0]],
                    $p.fieldWidths[groupFieldIds[1]]
                ];
            } else {
                groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
                $p.resultDimension = [$p.fieldWidths[groupFieldIds[0]], 1];
            }


            // console.log( groupFieldIds, $p.resultDimension, $p.fieldWidths, $p.fieldDomains);
            // var resultFields = Object.keys(spec).filter(function(d){return d!='$by' && d!='$group';}),
            //     resultFieldIds = resultFields.map(function(f) { return fields.indexOf(f); }),
            //     operators = resultFields.map(function(r){return spec[r]; });


            var newFieldSpec = spec.$calculate || spec.$reduce || spec.$out || null;

            if(newFieldSpec === null) {
                newFieldSpec = {};
                Object.keys(spec).filter(function(d) {
                    return d != '$by' && d != '$group';
                }).forEach(function(d) {
                    newFieldSpec[d] = spec[d];
                });
            }

            var newFieldNames = Object.keys(newFieldSpec),
                resultFields = newFieldNames.map(function(f) {
                    return newFieldSpec[f][Object.keys(newFieldSpec[f])[0]];
                }),
                resultFieldIds = resultFields.map(function(f) {
                    return $p.fields.indexOf(f);
                }),
                operators = resultFields.map(function(f, i) {
                    return Object.keys(newFieldSpec[newFieldNames[i]])[0];
                });

            if(!$p._update)
                $p.framebuffer(
                    "fGroupResults",
                    "float", [$p.resultDimension[0], $p.resultDimension[1] * resultFields.length]
                );
            _execute(operators, groupFieldIds, resultFieldIds);

            $p.getResult = aggregate.result;
            console.log($p.getResult());


            $p.indexes = groupFields;

            $p.dataDimension = $p.resultDimension;

            var newFieldIds = groupFieldIds.filter(function(f) {
                return f !== -1
            }).concat(resultFieldIds);

            $p.fields = groupFields
                .map(function(gf) {
                    return (gf.substring(0,4) == 'bin@')? gf.slice(4) : gf;
                })
                .concat(newFieldNames);

            $p.uniform.uDataDim.data = $p.resultDimension;
            $p.uniform.uIndexCount.data = $p.indexes.length;
            $p.uniform.uFieldCount.data = $p.fields.length - $p.indexes.length;

            // $p.fieldWidths = $p.fieldWidths.concat($p.deriveWidths);
            // $p.fieldDomains = $p.fieldDomains.concat($p.deriveDomains);

            $p.fieldDomains = newFieldIds.map(function(f) {
                return $p.fieldDomains[f];
            });
            $p.fieldWidths = newFieldIds.map(function(f) {
                return $p.fieldWidths[f];
            });
            $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;

            $p.attribute.aDataItemId = utils.seqFloat(0, $p.resultDimension[0] * $p.resultDimension[1] - 1);
            $p.dataSize = $p.resultDimension[0] * $p.resultDimension[1];
            $p.uniform.uDataSize.data = $p.dataSize;


            $p.indexes.forEach(function(d, i) {
                // $p.attribute['aDataId' + vecId[i]] = utils.seqFloat(0, $p.resultDimension[i]-1);
                $p.attribute['aDataId' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {return i;});
                $p.attribute['aDataVal' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {return i;});
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId'+ vecId[i]].location, i);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal'+ vecId[i]].location, i);
            });

            if ($p.indexes.length == 1) {
                $p.attribute.aDataIdy = new Float32Array(1);
                $p.attribute.aDataValy = new Float32Array(1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            }
            if(!$p._update) {
                resultDomains = $p.opt.extent(resultFieldIds, $p.dataDimension);
            }
            for (var ii = $p.indexes.length; ii < $p.indexes.length + resultFieldIds.length; ii++) {
                $p.fieldDomains[ii] = resultDomains[ii - $p.indexes.length];
                $p.fieldWidths[ii] = resultDomains[ii - $p.indexes.length][1] - resultDomains[ii - $p.indexes.length][0];
            }

            $p.uniform.uFieldDomains.data = $p.fieldDomains;
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
            $p.uniform.uFilterFlag.data = 0;

            // $p.ctx.finish();
            // const vecId = ['x', 'y', 'z'];
            $p.indexes.forEach(function(d, i) {
                // $p.attribute['aDataId' + vecId[i]] = utils.seqFloat(0, $p.resultDimension[i]-1);
                var interval = 1;

                if($p.intervals.hasOwnProperty(d))
                    interval = $p.intervals[d].interval;

                $p.attribute['aDataVal' + vecId[i]] = utils.seqFloat(
                    $p.fieldDomains[i][0],
                    $p.fieldDomains[i][1],
                    interval
                );
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + vecId[i]].location, i);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + vecId[i]].location, i);
            });

            console.log($p.fields, $p.fieldDomains, $p.fieldWidths);
        }

        aggregate.result = function(arg) {
            var options = arg || {},
                offset = options.offset || [0, 0],
                resultSize = options.size || $p.resultDimension[0]* $p.resultDimension[1],
                rowTotal = Math.min(resultSize, $p.resultDimension[0]),
                colTotal = Math.ceil(resultSize/$p.resultDimension[0]);

            $p.bindFramebuffer("fGroupResults");
            var gl = $p.program("group"),
                result = new Float32Array(rowTotal * colTotal * 4 * resultFieldCount);

            gl.readPixels(offset[0], offset[1], rowTotal, colTotal * resultFieldCount, gl.RGBA, gl.FLOAT, result);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return result.filter(function(d, i){ return i%4===3;} );
        }

        return aggregate;
    }
});
