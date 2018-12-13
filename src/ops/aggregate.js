import {seqFloat} from '../utils';

const vecId = ['x', 'y', 'z'];
const aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];
const smallest = -Math.pow(2, 128);
const largest = Math.pow(2, 127);
export default function aggregate($p) {
    var aggregate = {};

    $p.uniform('uFillValue', 'float', 0.0);
    $p.uniform('uBinIntervals', 'vec2', [0.0, 0.0]);
    $p.uniform('uBinCount', 'int', 0);
    $p.uniform('uAggrOpt', 'int', 2);

    function vertexShader() {
        gl_PointSize = 1.0;

        var i, j;
        var groupKeyValue;

        i = (this.aDataIdx + 0.5) / this.uDataDim.x;
        j = (this.aDataIdy + 0.5) / this.uDataDim.y;
        this.vResult = this.getData(this.uFieldId, i, j);

        if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
            this.vResult = 0.0;
        }

        if (this.uFilterFlag == 1) {
            if (texture2D(this.fFilterResults, vec2(i, j)).a < this.uVisLevel - 0.01) {
                this.vResult = 0.0;
            }
        }

        var pos = new Vec2();
        for (var ii = 0; ii < 2; ii++) {
            var gid = new Int();
            gid = this.uGroupFields[ii];
            if (gid != -1) {
                if (this.uIndexCount > 0) {
                    if (gid == 0) {
                        groupKeyValue = i;
                    } else if (gid == 1) {
                        groupKeyValue = j;
                    }
                }
                if (this.uIndexCount == 0 || gid > 1) {
                    var d = new Vec2();
                    var w = this.getFieldWidth(gid);
                    var value = this.getData(gid, i, j);

                    d = this.getFieldDomain(gid);

                    if(this.uBinCount > 0) {
                        value = max(ceil((value - d[0]) / this.uBinIntervals[ii]), 1.0);
                        groupKeyValue = value  /  float(this.uBinCount);
                    } else {
                        groupKeyValue = (value - d.x) / (d.y - d.x) * w / (w + 1.0);
                        groupKeyValue += 0.5 / w;
                    }
                }
                pos[ii] = groupKeyValue * 2.0 - 1.0;
            } else {
                pos[ii] = 0.5;
            }
        }

        gl_Position = vec4(pos, 0.0, 1.0);
    }

    function fragmentShader() {
        if (this.vResult == 0.0) discard;

        if (this.uAggrOpt == 2)
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        else
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
    }

    var vs = $p.shader.vertex(vertexShader),
        fs = $p.shader.fragment(fragmentShader);

    $p.program('group', vs, fs);

    var vs2 = $p.shader.vertex(function main() {
        gl_Position = vec4(this._square, 0, 1);
    });

    var fs2 = $p.shader.fragment(function() {
        var x, y, res;
        $vec4(value);

        if (this.uAggrOpt > 3) {
            x = (gl_FragCoord.x) / this.uResultDim.x;
            y = (gl_FragCoord.y) / (uResultDim.y * float(this.uFieldCount));
            value = texture2D(this.uDataInput, vec2(x, y));
            res = value.a / value.b;
        } else {
            res = value.a;
        }
        gl_FragColor = vec4(0.0, 0.0, 0.0, res);
    });
    
    $p.program('group2', vs2, fs2);
    $p.program('fill', vs2,  $p.shader.fragment(function() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, this.uFillValue);
    }));

    var resultFieldCount,
        getAvgValues = false,
        getVarStd = false,
        resultDomains;

    function compute(opts, groupFieldIds, resultFieldIds) {

        resultFieldCount = resultFieldIds.length;
        let gl = $p.program('fill');
        $p.bindFramebuffer('fGroupResults');

        if(!$p._progress) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        gl.disable(gl.BLEND);
        resultFieldIds.forEach(function(f, i) {
            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            var opt = aggrOpts.indexOf(opts[i]);
            if (opt == 0) {
                $p.uniform.uFillValue = largest;
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } else if(opt == 1) {
                $p.uniform.uFillValue = smallest;
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        });

        gl = $p.program('group');
      
        $p.framebuffer.enableRead('fDerivedValues');
        $p.framebuffer.enableRead('fFilterResults');

        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

        $p.uniform.uGroupFields = groupFieldIds;

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        $p.uniform.uResultDim = $p.resultDimension;

        let postComputeFieldIds = [];
        
        getAvgValues = false;
        getVarStd = false;

        resultFieldIds.forEach(function(f, i) {
            var opt = aggrOpts.indexOf(opts[i]);
            if (opt == -1) throw Error('unknowm operator for aggregation: ' + opts[i]);

            if (opt > 3) {
                getAvgValues = true;
                $p.bindFramebuffer('fAggrStats');
                postComputeFieldIds.push(i);
            } else {
                $p.bindFramebuffer('fGroupResults');
            }

            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            if (opt == 0) {
                gl.blendEquation(gl.MIN_EXT);
            } else if (opt == 1) {
                gl.blendEquation(gl.MAX_EXT);
            } else {
                gl.blendEquation(gl.FUNC_ADD);
            }

            $p.uniform.uFieldId = f;
            $p.uniform.uAggrOpt = opt;
            gl.ext.drawArraysInstancedANGLE(
                gl.POINTS, 0,
                $p.dataDimension[0],
                $p.dataDimension[1]
            );
        });
        $p.uniform.uFieldCount.data = resultFieldIds.length;
        if(getAvgValues) {
            postCompute(opts, postComputeFieldIds, resultFieldIds);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function postCompute(opts, postComputeFieldIds, resultFieldIds) {
        $p.uniform.uDataInput.data = $p.framebuffer.fAggrStats.texture;
        var gl = $p.program('group2');
        $p.bindFramebuffer('fGroupResults');
        $p.uniform.uResultDim = $p.resultDimension;
        $p.framebuffer.enableRead('fAggrStats');
        // gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
        gl.viewport(0, 0, $p.resultDimension[0], $p.resultDimension[1]* resultFieldIds.length);
        gl.disable(gl.BLEND);

        postComputeFieldIds.forEach(function(f) {
            $p.uniform.uAggrOpt = aggrOpts.indexOf(opts[f]);
            $p.uniform.uFieldId = f;
            gl.viewport(0, 
                f * $p.resultDimension[1], 
                $p.resultDimension[0], 
                $p.resultDimension[1]
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        })
    }

    aggregate.execute = function(spec) {
        let groupFields = spec.$by || spec.$group;
        let groupFieldIds = [-1, -1];

        if (!Array.isArray(groupFields)) groupFields = [groupFields];
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

        let newFieldSpec = spec.$collect || spec.$reduce || spec.$out || null;

        // For backward compatibility, allowing new fields specified without using the $collect or $reduce
        if (newFieldSpec === null) {
            newFieldSpec = {};
            Object.keys(spec).filter(function(d) {
                return d != '$by' && d != '$group';
            }).forEach(function(d) {
                newFieldSpec[d] = spec[d];
            });
        }

        let newFieldNames = Object.keys(newFieldSpec);
        let resultFields = newFieldNames.map(f => newFieldSpec[f][Object.keys(newFieldSpec[f])[0]]);
        let resultFieldIds = resultFields.map( f => (f == '*') ? 0 : $p.fields.indexOf(f));
        let operators = resultFields.map( (f,i) => { 
            return (typeof(newFieldSpec[newFieldNames[i]]) === 'object')
                ? Object.keys(newFieldSpec[newFieldNames[i]])[0]
                : newFieldSpec[newFieldNames[i]]
        });

        let twoPassFields = operators.filter(opt => aggrOpts.indexOf(opt) > 2 );

        if (!$p._update && !$p._progress) {
            $p.framebuffer(
                'fGroupResults',
                'float', [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
            );

            if(twoPassFields.length > 0) {
                $p.framebuffer(
                    'fAggrStats',
                    'float', [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
                );
            }
        }

        $p.bindFramebuffer('fGroupResults');

        compute(operators, groupFieldIds, resultFieldIds);

        $p.getResult = aggregate.result;
        $p.indexes = groupFields;
        $p.dataDimension = $p.resultDimension;

        $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;

        var oldFieldIds = groupFields.concat(resultFields).map( f => $p.fields.indexOf(f));

        $p.fields = groupFields
            // .map(function(gf) {
            //     return (gf.substring(0, 4) == 'bin@') ? gf.slice(4) : gf;
            // })
            .concat(newFieldNames);

        $p.uniform.uDataDim.data = $p.resultDimension;
        $p.uniform.uIndexCount.data = $p.indexes.length;
        $p.uniform.uFieldCount.data = $p.fields.length - $p.indexes.length;

        // $p.fieldWidths = $p.fieldWidths.concat($p.deriveWidths);
        // $p.fieldDomains = $p.fieldDomains.concat($p.deriveDomains);
       
        let newFieldDomains = oldFieldIds.map(f => $p.fieldDomains[f]);
        let newFieldWidths = oldFieldIds.map(f => $p.fieldWidths[f]);
        
        if($p.uniform.uBinCount.data > 0) {
            oldFieldIds.slice(0, groupFields.length).forEach((fid, fii) => {
                // Array.from(Array($p.uniform.uBinCount.data).keys())
                newFieldDomains[fii] = [0, $p.uniform.uBinCount.data-1];

            })
            $p.uniform.uBinCount.data = 0;
        }

        $p.fieldDomains = newFieldDomains;
        $p.fieldWidths = newFieldWidths;
        // $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;
       
        $p.attribute.aDataItemId = seqFloat(0, $p.resultDimension[0] * $p.resultDimension[1] - 1);
        $p.dataSize = $p.resultDimension[0] * $p.resultDimension[1];
        $p.uniform.uDataSize.data = $p.dataSize;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            $p.attribute['aDataId' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.attribute['aDataVal' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + vecId[i]].location, i);
        });

        if ($p.indexes.length == 1) {
            $p.attribute.aDataIdy = new Float32Array(1);
            $p.attribute.aDataValy = new Float32Array(1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        }
        if (!$p._update) {
            let resultFieldIds = resultFields.map( f => (f == '*') ? 0 : $p.fields.indexOf(f));
            resultDomains = $p.extent(resultFieldIds, $p.dataDimension);
        }
        for (var ii = $p.indexes.length; ii < $p.indexes.length + resultFields.length; ii++) {
            $p.fieldDomains[ii] = resultDomains[ii - $p.indexes.length];
            $p.fieldWidths[ii] = resultDomains[ii - $p.indexes.length][1] - resultDomains[ii - $p.indexes.length][0];
        }

        $p.uniform.uFieldDomains.data = $p.fieldDomains;
        $p.uniform.uFieldWidths.data = $p.fieldWidths;
        $p.uniform.uFilterFlag.data = 0;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            var interval = 1;
            var ifid = $p.fields.indexOf(d);
            // if ($p.intervals.hasOwnProperty(d))
            //     interval = $p.intervals[d].interval;

            $p.attribute['aDataVal' + vecId[i]] = seqFloat(
                $p.fieldDomains[ifid][0],
                $p.fieldDomains[ifid][1],
                interval
            );

            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + vecId[i]].location, i);
        });

        $p.getResultBuffer = aggregate.result;
    }

    aggregate.result = function(arg) {
        let options = arg || {};
        let offset = options.offset || [0, 0];
        let resultSize = options.size || $p.resultDimension[0] * $p.resultDimension[1];
        let rowTotal = Math.min(resultSize, $p.resultDimension[0]);
        let colTotal = Math.ceil(resultSize / $p.resultDimension[0]);
        let result = new Float32Array(rowTotal * colTotal * 4 * resultFieldCount);
        
        $p.bindFramebuffer('fGroupResults');

        let gl = $p.program('group');
        gl.readPixels(offset[0], offset[1], rowTotal, colTotal * resultFieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return result.filter((d, i) => i % 4 === 3);
    }

    return aggregate;
}
