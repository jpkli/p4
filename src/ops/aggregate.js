import {seqFloat} from '../utils';
import {Aggregate, GetStats, FillValues} from './gpgpu/Aggregation.gl';

const VEC_IDS = ['x', 'y', 'z'];
const METRICS = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];

export default function aggregate($p) {
    let aggregate = {};

    $p.uniform('uFillValue', 'float', 0.0);
    $p.uniform('uBinIntervals', 'vec2', [0.0, 0.0]);
    $p.uniform('uBinCount', 'ivec2', [0, 0]);
    $p.uniform('uAggrOpt', 'float', 2.0);
    $p.uniform("uGroupFields", "int",   [0, -1, -1]);
    $p.uniform("uExtraKeyValue", "float",  0.0);
    $p.extraDimension = 1;

    $p.program(
        'AggregateCompute',
        $p.shader.vertex(Aggregate.vertexShader),
        $p.shader.fragment(Aggregate.fragmentShader)
    );

    $p.program(
        'GetAggrStats',
        $p.shader.vertex(GetStats.vertexShader),
        $p.shader.fragment(GetStats.fragmentShader)
    );
    $p.program(
        'FillValues',
        $p.shader.vertex(FillValues.vertexShader),
        $p.shader.fragment(FillValues.fragmentShader)
    );

    var resultFieldCount,
        getAvgValues = false,
        getVarStd = false,
        resultDomains;

    function compute(opts, groupFieldIds, resultFieldIds, outputTag) {
        resultFieldCount = resultFieldIds.length;
        let gl = $p.program('FillValues');
        $p.bindFramebuffer(outputTag);

        if(!$p._progress) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        gl.disable(gl.BLEND);
        resultFieldIds.forEach(function(f, i) {
            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            var opt = METRICS.indexOf(opts[i]);
            if (opt == 0) {
                $p.uniform.uFillValue = Math.pow(2, 127);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } else if(opt == 1) {
                $p.uniform.uFillValue = -Math.pow(2, 128);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        });

        gl = $p.program('AggregateCompute');
      
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

        for (var ii = 0; ii < $p.extraDimension; ii++) {
            postComputeFieldIds = [];
            resultFieldIds.forEach(function(f, i) {
                var opt = METRICS.indexOf(opts[i]);
                if (opt == -1) throw Error('unknowm operator for aggregation: ' + opts[i]);

                if (opt > 3) {
                    getAvgValues = true;
                    $p.bindFramebuffer('fAggrStats');
                    postComputeFieldIds.push(i);
                } else {
                    $p.bindFramebuffer(outputTag);
                }

                gl.viewport(ii * $p.resultDimension[0], i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
                if (opt == 0) {
                    gl.blendEquation(gl.MIN_EXT);
                } else if (opt == 1) {
                    gl.blendEquation(gl.MAX_EXT);
                } else {
                    gl.blendEquation(gl.FUNC_ADD);
                }

                $p.uniform.uFieldId = f;
                $p.uniform.uAggrOpt = opt;
                if(groupFieldIds[2] !== -1) {
                    $p.uniform.uExtraKeyValue = seqFloat($p.fieldDomains[groupFieldIds[2]][0], $p.fieldDomains[groupFieldIds[2]][1])[ii];
                }
                
                gl.ext.drawArraysInstancedANGLE(
                    gl.POINTS, 0,
                    $p.dataDimension[0],
                    $p.dataDimension[1]
                );
            });
        }
        $p.uniform.uFieldCount.data = resultFieldIds.length;
        if(getAvgValues) {
            postCompute(opts, postComputeFieldIds, resultFieldIds, outputTag);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function postCompute(opts, postComputeFieldIds, resultFieldIds, outputTag) {
        $p.uniform.uDataInput.data = $p.framebuffer.fAggrStats.texture;
        var gl = $p.program('GetAggrStats');
        $p.bindFramebuffer(outputTag);
        $p.uniform.uResultDim = [$p.resultDimension[0] * $p.extraDimension, $p.resultDimension[1]];
        $p.framebuffer.enableRead('fAggrStats');
        // gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
        
        gl.viewport(0, 0, $p.resultDimension[0] * $p.extraDimension, $p.resultDimension[1] * resultFieldIds.length);
        gl.disable(gl.BLEND);

        postComputeFieldIds.forEach(function(f) {
            $p.uniform.uAggrOpt = METRICS.indexOf(opts[f]);
            $p.uniform.uFieldId = f;
            gl.viewport(
                0, 
                f * $p.resultDimension[1], 
                $p.resultDimension[0] * $p.extraDimension,
                $p.resultDimension[1]
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        })
    }

    aggregate.execute = function(spec) {
        let newFieldSpec = spec.$collect || spec.$reduce || null;
        let groupFields = spec.$group || spec.group;
        let groupFieldIds = [-1, -1, -1];
        let outputTag = spec.out || 'fGroupResults';
        if (!Array.isArray(groupFields)) groupFields = [groupFields];
        if (groupFields.length >= 2) {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            groupFieldIds[1] = $p.fields.indexOf(groupFields[1]);
            $p.resultDimension = [
                $p.fieldWidths[groupFieldIds[0]],
                $p.fieldWidths[groupFieldIds[1]]
            ];
            if(groupFields.length === 3) {
                groupFieldIds[2] = $p.fields.indexOf(groupFields[2]);
                $p.extraDimension = $p.fieldWidths[groupFieldIds[2]];
            } else {
                $p.extraDimension = 1
            }
        } else {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            $p.resultDimension = [$p.fieldWidths[groupFieldIds[0]], 1];
        }

        // For backward compatibility, allowing new fields specified without using the $collect or $reduce
        if (newFieldSpec === null) {
            newFieldSpec = {};
            Object.keys(spec)
            .filter(d => d != '$by' && d != '$group')
            .forEach(function(d) {
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
        let twoPassFields = operators.filter(opt => METRICS.indexOf(opt) > 2 );

        if (!$p._update && !$p._progress) {
            $p.framebuffer(
                outputTag,
                'float', [$p.resultDimension[0] * $p.extraDimension, $p.resultDimension[1] * resultFieldIds.length]
            );

            if(twoPassFields.length > 0) {
                $p.framebuffer(
                    'fAggrStats',
                    'float', [$p.resultDimension[0] * $p.extraDimension, $p.resultDimension[1] * resultFieldIds.length]
                );
            }
        }
        $p.bindFramebuffer(outputTag);

        compute(operators, groupFieldIds, resultFieldIds, outputTag);

        $p.getResult = aggregate.result;
        $p.indexes = groupFields;
        $p.dataDimension = $p.resultDimension;
        $p.uniform.uDataInput.data = $p.framebuffer[outputTag].texture;

        var oldFieldIds = groupFields.concat(resultFields).map( f => $p.fields.indexOf(f));

        $p.fields = groupFields.concat(newFieldNames);
        $p.uniform.uDataDim.data = $p.resultDimension;
        $p.uniform.uIndexCount.data = $p.indexes.length;
        $p.fieldCount = $p.fields.length - $p.indexes.length;
        $p.uniform.uFieldCount.data = $p.fieldCount;

        // $p.fieldWidths = $p.fieldWidths.concat($p.deriveWidths);
        // $p.fieldDomains = $p.fieldDomains.concat($p.deriveDomains);
       
        let newFieldDomains = oldFieldIds.map(f => $p.fieldDomains[f]);
        let newFieldWidths = oldFieldIds.map(f => $p.fieldWidths[f]);
        
        oldFieldIds.slice(0, groupFields.length).forEach((fid, fii) => {
            if($p.uniform.uBinCount.data[fii] > 0) {
                newFieldDomains[fii] = [0, $p.uniform.uBinCount.data[fii]-1];
            }
        })
        $p.uniform.uBinCount.data = [0,0];

        $p.fieldDomains = newFieldDomains;
        $p.fieldWidths = newFieldWidths;
       
        $p.attribute.aDataItemId = seqFloat(0, $p.resultDimension[0] * $p.resultDimension[1] - 1);
        $p.dataSize = $p.resultDimension[0] * $p.resultDimension[1];
        $p.uniform.uDataSize.data = $p.dataSize;
        $p.uniform.uFieldDomains.data = $p.fieldDomains;
        $p.uniform.uFieldWidths.data = $p.fieldWidths;
        $p.uniform.uFilterFlag.data = 0;

        $p.indexes.forEach(function(d, i) {
            $p.attribute['aDataId' + VEC_IDS[i]] = seqFloat(0, $p.resultDimension[i]-1);
            var interval = 1;
            var ifid = $p.fields.indexOf(d);
            // if ($p.intervals.hasOwnProperty(d)) interval = $p.intervals[d].interval;
            $p.attribute['aDataVal' + VEC_IDS[i]] = seqFloat(
                $p.fieldDomains[ifid][0],
                $p.fieldDomains[ifid][1],
                interval
            );
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + VEC_IDS[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + VEC_IDS[i]].location, i);
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
        $p.getResultBuffer = aggregate.result;
        // console.log(aggregate.result({outputTag}))
    }

    aggregate.result = function(arg) {
        let options = arg || {};
        let outputTag =  arg.outputTag || 'fGroupResults';
        let offset = options.offset || [0, 0];
        let resultSize = options.size || $p.resultDimension[0] * $p.resultDimension[1];
        let rowTotal = Math.min(resultSize, $p.resultDimension[0]);
        let colTotal = Math.ceil(resultSize / $p.resultDimension[0]);
        let result = new Float32Array(rowTotal * colTotal * 4 * resultFieldCount);
        $p.bindFramebuffer(outputTag);
        let gl = $p.program('AggregateCompute');
        gl.readPixels(offset[0], offset[1], rowTotal, colTotal * resultFieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return result.filter((d, i) => i % 4 === 3);
    }

    return aggregate;
}
