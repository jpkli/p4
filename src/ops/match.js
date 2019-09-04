import {IntervalMatch, DiscreteMatch} from './gpgpu/Match.gl.js'

export default function match($p) {
    const SELECT_MAX = 100;
    let match = {};
    let dataDimension = $p.uniform.uDataDim.data;
    let fieldCount = $p.fields.length;
    let filterControls = new Array(fieldCount).fill(0);
    let filterRanges = $p.fieldDomains;
    let visControls = new Array(fieldCount).fill(0);
    let visRanges = $p.fieldDomains;
    let inSelections = new Array(SELECT_MAX);
    let matchResultBuffer = null;

    $p.uniform('uInSelections', 'float', Float32Array.from(inSelections));
    $p.uniform('uSelectMax', 'int', SELECT_MAX);
    $p.uniform('uSelectCount', 'int', 0);

    let rangeMatch = {
        vs: $p.shader.vertex(IntervalMatch.vertexShader),
        fs: $p.shader.fragment(IntervalMatch.fragmentShader)
    };

    let inMatch = {
        vs: $p.shader.vertex(DiscreteMatch.vertexShader),
        fs: $p.shader.fragment(DiscreteMatch.fragmentShader)
    };

    $p.program('IntervalMatch', rangeMatch.vs, rangeMatch.fs);
    $p.program('DiscreteMatch', inMatch.vs, inMatch.fs);

    match.control = function(ctrl) {
        filterControls = ctrl;
    }

    function _execute(spec){
        var fields = $p.fields
        var gl;
        var matchFields = Object.keys(spec).filter(function(s){
            return spec[s].hasOwnProperty('$in');
        })
        .concat(Object.keys($p.crossfilters).filter(function(s){
            return $p.crossfilters[s].hasOwnProperty('$in');
        }))

        $p.bindFramebuffer('fFilterResults');
       
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        if(matchFields.length) {
            gl = $p.program('DiscreteMatch');
            if($p.deriveCount > 0) {
                $p.framebuffer.enableRead('fDerivedValues');
            }

            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MIN_EXT);

            matchFields.forEach(function(k){
                var fieldId = $p.fields.indexOf(k);
                var inSelections = (spec.hasOwnProperty(k)) ? spec[k].$in :  $p.crossfilters[k].$in;
                if($p.strValues.hasOwnProperty(k)) {
                    inSelections = inSelections
                        .slice(0, SELECT_MAX)
                        .map(function(v) { return $p.strValues[k][v]; });
                } else {
                    inSelections = inSelections.slice(0, SELECT_MAX);
                }
                $p.uniform.uSelectCount = inSelections.length;
                $p.uniform.uInSelections = Float32Array.from(inSelections);
                $p.uniform.uFieldId = fieldId;

                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, $p.dataDimension[0], $p.dataDimension[1]);
                // filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                // filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
                filterRanges[fieldId] = [Math.min.apply(null, inSelections), Math.max.apply(null, inSelections)];
            })
        }

        var filterSelections = Object.keys(spec).filter(function(s){
            return !spec[s].hasOwnProperty('$in');
        });

        var viewSelections = Object.keys($p.crossfilters).filter(function(s){
            return !$p.crossfilters[s].hasOwnProperty('$in'); 
        });
     
        if(filterSelections.length || viewSelections.length){
            filterControls = new Array(fieldCount).fill(0);

            filterSelections.forEach(function(k){
                var fieldId = $p.fields.indexOf(k);
                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if(spec[k].length < 2) spec[k][1] = spec[k][0];
                filterControls[fieldId] = 1;
                filterRanges[fieldId] = spec[k];
                // filterRanges[fieldId*2] = spec[k][0];
                // filterRanges[fieldId*2+1] = spec[k][1];
            });

            viewSelections.forEach(function(k){
                
                var fieldId = $p.fields.indexOf(k);
                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if($p.crossfilters[k].length < 2) $p.crossfilters[k][1] = $p.crossfilters[k][0];
                visControls[fieldId] = 1;
                visRanges[fieldId] = $p.crossfilters[k];
            });

            $p.uniform.uFilterControls.data = filterControls;
            $p.uniform.uFilterRanges.data = filterRanges;
            $p.uniform.uVisControls.data = visControls;
            $p.uniform.uVisRanges.data = visRanges;

            if (matchFields.length) {
                matchResultBuffer= match.result();
                $p.bindFramebuffer('fFilterResults');
            }

            gl = $p.program('IntervalMatch');
            if($p.deriveCount > 0) {
                $p.framebuffer.enableRead('fDerivedValues');
            }
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.disable(gl.BLEND);
            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.viewport(0, 0, $p.dataDimension[0], $p.dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, $p.dataDimension[0], $p.dataDimension[1]);
        }
        $p.ctx.bindFramebuffer($p.ctx.FRAMEBUFFER, null);
        return filterRanges;
    }

    match.execute = function(spec, skipUpdateDomain = false) {
        filterControls = new Array($p.fields.length).fill(0);
        visControls = new Array($p.fields.length).fill(0);
        var filterSpec = spec;

        Object.keys($p.crossfilters).forEach(function(k, i) {
            if($p.strValues.hasOwnProperty(k) && !$p.crossfilters[k].$in) {
                let filterValues = $p.crossfilters[k];
                if(filterValues.length > 1) {
                    let startIndex = $p.strLists[k].indexOf($p.crossfilters[k][0]);
                    let endIndex = $p.strLists[k].indexOf($p.crossfilters[k][1]);
                    filterValues = $p.strLists[k].slice(startIndex, endIndex + 1);
                }
                $p.crossfilters[k] = {$in: filterValues};
            }
        });

        Object.keys(filterSpec).forEach(function(k, i) {
            if($p.strValues.hasOwnProperty(k) && !spec[k].$in) {
                spec[k] = {$in: spec[k]};
            }
        });

        $p.uniform.uFilterFlag = 1;
        if(!$p._update) {
           
            $p.framebuffer('fFilterResults', 'unsigned_byte', $p.dataDimension);
            filterRanges = $p.fieldDomains.slice();
            visRanges = $p.fieldDomains.slice();
        }
        var newDomains = _execute(spec);

        if(!$p._update){
            newDomains.forEach(function(domain, fid) {
                var d = domain;
                // if($p.dtypes[fid] == 'int') d[1] -= 1;
                $p.fieldDomains[fid] = d;
                $p.fieldWidths[fid] = $p.getDataWidth(fid, d);
            });

            $p.uniform.uFieldDomains.value($p.fieldDomains);
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
        $p.getMatchBuffer = match.result;
    }

    match.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        $p.bindFramebuffer('fFilterResults');

        var gl = $p.ctx;
        var bitmap = new Uint8Array(rowSize*colSize*4);
        gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        let result = bitmap.filter((d, i) => i % 4 === 3);
        if(matchResultBuffer !== null) {
            result = result.map((r,i) => r & matchResultBuffer[i])
            matchResultBuffer = null
        }
        
        return result;
    }

    return match;
}
