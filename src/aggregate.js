define(function(require){
    const utils = require('./utils');
    return function aggregate(context) {
        var aggregate = {},
            aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];

        context.uniform('uGroupGetStat', 'float', 0.0)
            .uniform('uAggrOpt', 'int', 2);

        function vertexShader(){
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

        function fragmentShader() {
            if(this.vResult == 0.0) discard;

            if(this.uAggrOpt == 2)
                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
            else
                gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        }

        var vs = context.shader.vertex(vertexShader),
            fs = context.shader.fragment(fragmentShader);

        context.program("group", vs, fs);

        var vs2 = context.shader.vertex(function main() {
             gl_Position = vec4(this._square, 0, 1);
        });

        var fs2 = context.shader.fragment(function () {
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

        context.program("group2", vs2, fs2);

        var resultFieldCount,
            secondPass = false,
            thirdPass = false;

        function _execute(opts, groupFieldIds, resultFieldIds) {
            resultFieldCount = resultFieldIds.length;
            var gl = context.program("group");
            context.bindFramebuffer("fGroupResults");
            context.framebuffer.enableRead("fDerivedValues");
            context.framebuffer.enableRead("fFilterResults");
            context.uniform.uGroupFields = groupFieldIds;
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.FUNC_ADD);
            context.uniform.uGroupGetStat = 0.0;
            var resultDomains = new Array(resultFieldIds.length);
            context.uniform.uResultDim = context.resultDimension;

            secondPass = false;
            thirdPass = false;
            resultFieldIds.forEach(function(f, i){
                var opt = aggrOpts.indexOf(opts[i]);
                if(opt == -1) throw Error("unknow operator for aggreation: " + opts[i]);
                gl.viewport(0, i*context.resultDimension[1], context.resultDimension[0], context.resultDimension[1]);
                if(opt == 0) gl.blendEquation(gl.MIN_EXT);
                else if(opt == 1) gl.blendEquation(gl.MAX_EXT);
                else gl.blendEquation(gl.FUNC_ADD);
                context.uniform.uFieldId = f;
                context.uniform.uAggrOpt = opt;
                gl.ext.drawArraysInstancedANGLE(
                    gl.POINTS, 0,
                    context.dataDimension[0],
                    context.dataDimension[1]
                );
                if(opt > 3) {
                    secondPass = true;
                    if(opt > 4) thirdPass = true;
                }
            });

            if(secondPass) {
                // console.log('*** Second Pass for Aggregation');
                var fieldCount = context.uniform.uFieldCount.data,
                    preAggrData = context.uniform.uDataInput.data;

                context.uniform.uDataInput.data = context.framebuffer.fGroupResults.texture;
                context.uniform.uFieldCount.data = resultFieldIds.length;

                if(thirdPass){
                    context.framebuffer(
                        "fAggrStats",
                        "float", [context.resultDimension[0], context.resultDimension[1] * resultFieldIds.length]
                    );
                    context.bindFramebuffer("fAggrStats");
                } else {
                    context.framebuffer(
                        "fGroupResults",
                        "float",
                        [context.resultDimension[0], context.resultDimension[1] * resultFieldIds.length]
                    );
                    context.bindFramebuffer("fGroupResults");
                }

                gl = context.program("group2");
                gl.disable( gl.BLEND );
                resultFieldIds.forEach(function(f, i){
                    var opt = aggrOpts.indexOf(opts[i]);
                    context.uniform.uAggrOpt = opt;
                    context.uniform.uFieldId = i;
                    gl.viewport(0, i*context.resultDimension[1], context.resultDimension[0], context.resultDimension[1]);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                })

            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        aggregate.execute = function(spec) {
            var groupFields = spec.$by || spec.$group,
                groupFieldIds = [-1, -1];

            if (Array.isArray(groupFields)) {
                groupFieldIds[0] = context.fields.indexOf(groupFields[0]);
                groupFieldIds[1] = context.fields.indexOf(groupFields[1]);
            } else {
                groupFieldIds[0] = context.fields.indexOf(groupFields);
            }

            context.resultDimension = context.getGroupKeyDimension(groupFieldIds);
            // console.log(context.intervals, context.fieldWidths, context.resultDimension);
            // var resultFields = Object.keys(spec).filter(function(d){return d!='$by' && d!='$group';}),
            //     resultFieldIds = resultFields.map(function(f) { return fields.indexOf(f); }),
            //     operators = resultFields.map(function(r){return spec[r]; });

            var newFieldNames = Object.keys(spec).filter(function(d) {
                    return d != '$by' && d != '$group';
                }),
                resultFields = newFieldNames.map(function(f) {
                    return spec[f][Object.keys(spec[f])[0]];
                }),
                resultFieldIds = resultFields.map(function(f) {
                    return context.fields.indexOf(f);
                }),
                operators = resultFields.map(function(f, i) {
                    return Object.keys(spec[newFieldNames[i]])[0];
                });

            if(!context._update)
                context.framebuffer(
                    "fGroupResults",
                    "float", [context.resultDimension[0], context.resultDimension[1] * resultFields.length]
                );

            _execute(operators, groupFieldIds, resultFieldIds);
            context.ctx.finish();

            context.getResult = aggregate.result;

            // console.log(context.getResult());
            //
            // context.indexes = groupFields;
            if (!Array.isArray(groupFields)) groupFields = [groupFields];
            context.indexes = groupFields;

            context.dataDimension = context.resultDimension;

            var newFieldIds = groupFieldIds.filter(function(f) {
                return f !== -1
            }).concat(resultFieldIds);

            context.fields = groupFields
                .map(function(gf) {
                    return (gf.substring(0,4) == 'bin@')? gf.slice(4) : gf;
                })
                .concat(newFieldNames);

            context.uniform.uDataDim.data = context.resultDimension;
            context.uniform.uIndexCount.data = context.indexes.length;
            context.uniform.uFieldCount.data = context.fields.length - context.indexes.length;

            context.fieldWidths = context.fieldWidths.concat(context.deriveWidths);
            context.fieldDomains = context.fieldDomains.concat(context.deriveDomains);

            context.fieldDomains = newFieldIds.map(function(f) {
                return context.fieldDomains[f];
            });
            context.fieldWidths = newFieldIds.map(function(f) {
                return context.fieldWidths[f];
            });
            context.uniform.uDataInput.data = context.framebuffer.fGroupResults.texture;
            // if(groupFields.length == 1) {
            //     context.cachedResult = p4gl.result('row');
            //     console.log(context.cachedResult);
            // }
            var resultDomains = context.opt.stats(resultFieldIds, context.dataDimension);
            // context.ctx.finish();
            // console.log("stats time:", new Date() - statStart);
            for (var ii = context.indexes.length; ii < context.indexes.length + resultFieldIds.length; ii++) {
                context.fieldDomains[ii] = resultDomains[ii - context.indexes.length];
                context.fieldWidths[ii] = resultDomains[ii - context.indexes.length][1] - resultDomains[ii - context.indexes.length][0];
            }
            // console.log( resultFieldIds, fieldWidths, fieldDomains, fields, context.indexes, context.resultDimension);

            // context.attribute._vid = utils.seqFloat(0, context.resultDimension[0] * context.resultDimension[1] - 1);
            // context.attribute._fid = utils.seqFloat(0, fields.length);


            context.uniform.uFieldDomains.data = context.fieldDomains;
            context.uniform.uFieldWidths.data = context.fieldWidths;
            context.uniform.uFilterFlag.data = 0;

            // context.ctx.finish();
            // console.log('pregroup time', new Date() - start);
            context.indexes.forEach(function(d, i) {
                context.attribute['aIndex' + i] = utils.seqFloat(0, context.resultDimension[i] - 1);
                var interval = 1;

                if(context.intervals.hasOwnProperty(d))
                    interval = context.intervals[d].interval;

                context.attribute['aIndex' + i + 'Value'] = utils.seqFloat(
                    context.fieldDomains[i][0],
                    context.fieldDomains[i][1],
                    interval
                );

                context.ctx.ext.vertexAttribDivisorANGLE(context.attribute['aIndex' + i].location, i);
                context.ctx.ext.vertexAttribDivisorANGLE(context.attribute['aIndex' + i + 'Value'].location, i);
            });

            if (context.indexes.length == 1) {
                context.attribute.aIndex1 = utils.seqFloat(0, 1);
                context.attribute.aIndex1Value = utils.seqFloat(0, 1);
                context.ctx.ext.vertexAttribDivisorANGLE(context.attribute.aIndex1.location, 1);
                context.ctx.ext.vertexAttribDivisorANGLE(context.attribute.aIndex1Value.location, 1);
            }
        }

        aggregate.result =  function() {

            context.bindFramebuffer("fGroupResults");
            var gl = context.program("group"),
                result = new Float32Array(context.resultDimension[0]*context.resultDimension[1]*4*resultFieldCount);

            gl.readPixels(0, 0, context.resultDimension[0], context.resultDimension[1]*resultFieldCount, gl.RGBA, gl.FLOAT, result);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return result.filter(function(d, i){ return i%4===3;} );
        }

        return aggregate;
    }
});
