if(typeof define == "function") define(function(){ return match; })

function vertexShaderFilter(){
    var i, j, k, value;
    var filter = new Int(0);
    var sel = new Int(0);
    var visSelect = new Bool(false);
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
        if(this.uFilterControls[f] == 1 || this.uVisControls[f] == 1) {
            value = this.getData(f, i, j);

            if(this.uFilterControls[f] == 1) {
                if(value < this.uFilterRanges[f].x || value >= this.uFilterRanges[f].y) {
                    filter -= 1;
                }
            }
            if(this.uVisControls[f] == 1) {
                if(value < this.uVisRanges[f].x || value >= this.uVisRanges[f].y) {
                    sel -= 1;
                }
                visSelect = true;
            }

        }
    }
    this.vResult = 0.1;
    if(filter < 0) {
        this.vResult = 0.0;
    } else {
        if(visSelect)
            this.vResult = (sel < 0) ? 0.1 : 0.2;
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function vertexShaderSelect(){
    var i, j, k, value;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    this.vResult = this.uFilterLevel - 0.1;
    value = this.getData(this.uFieldId, i, j);
    for(var l = 0; l < 100; l++){
        if(l < this.uSelectCount) {
            if(value == this.uInSelections[l]) {
                this.vResult = this.uFilterLevel;
            }
        }
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
}

function match($p) {
    const SELECT_MAX = 100;
    var match = {},
        dataDimension = $p.uniform.uDataDim.data,
        fieldCount = $p.fields.length,
        filterControls = new Array(fieldCount).fill(0),
        filterRanges = $p.fieldDomains,
        visControls = new Array(fieldCount).fill(0),
        visRanges = $p.fieldDomains,
        inSelections = new Array(SELECT_MAX);

    $p.uniform("uFilterControls","int", filterControls)
        .uniform("uVisControls","int", filterControls)
        .uniform("uFilterRanges","vec2", filterRanges)
        .uniform("uVisRanges","vec2", filterRanges)
        .uniform("uInSelections", "float", Float32Array.from(inSelections))
        .uniform("uSelectMax", "int", SELECT_MAX)
        .uniform("uSelectCount", "int", 0);

    var filter = {
        vs: $p.shader.vertex(vertexShaderFilter),
        fs: $p.shader.fragment(fragmentShader)
    };

    var sel = {
        vs: $p.shader.vertex(vertexShaderSelect),
        fs: $p.shader.fragment(fragmentShader)
    };

    $p.program("filter", filter.vs, filter.fs);
    $p.program("match", sel.vs, sel.fs);

    match.control = function(ctrl) {
        // filterControls = ctrl;
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


        $p.bindFramebuffer("fFilterResults");
        $p.framebuffer.enableRead("fDerivedValues");
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        if(matchFields.length) {
            gl = $p.program("match");
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
                var fieldId = fields.indexOf(k);
                var inSelections = (spec.hasOwnProperty(k)) ? spec[k].$in :  $p.crossfilters[k].$in;
                if($p.categoryIndex.hasOwnProperty(k)) {
                    inSelections = inSelections
                        .slice(0, SELECT_MAX)
                        .map(function(v) { return $p.categoryIndex[k][v]; });
                } else {
                    inSelections = inSelections.slice(0, SELECT_MAX);
                }
                $p.uniform.uSelectCount = inSelections.length;
                $p.uniform.uInSelections = Float32Array.from(inSelections);
                $p.uniform.uFieldId = fieldId;

                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                // filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                // filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
                filterRanges[fieldId] = [Math.min.apply(null, inSelections), Math.max.apply(null, inSelections)];
            })
        }
        // console.log($p._responseType, spec);
        var filterSelections = Object.keys(spec).filter(function(s){
            return !spec[s].hasOwnProperty('$in');
        });

        var viewSelections = Object.keys($p.crossfilters).filter(function(s){
            return !$p.crossfilters[s].hasOwnProperty('$in');
        });;

        if(filterSelections.length || viewSelections.length){
            filterControls = new Array(fieldCount).fill(0);

            filterSelections.forEach(function(k){
                var fieldId = fields.indexOf(k);

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
                var fieldId = fields.indexOf(k);
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

            gl = $p.program("filter");
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.disable(gl.BLEND);
            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
        }
        $p.ctx.bindFramebuffer($p.ctx.FRAMEBUFFER, null);
        return filterRanges;
    }

    match.execute = function(spec) {
        filterControls = new Array(fieldCount).fill(0);
        visControls = new Array(fieldCount).fill(0);
        var filterSpec = spec;


        Object.keys($p.crossfilters).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !$p.crossfilters[k].$in) {
                $p.crossfilters[k] = {$in: $p.crossfilters[k]};
            }
        });


        Object.keys(filterSpec).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !spec[k].$in) {
                spec[k] = {$in: spec[k]};
            }
        });

        $p.uniform.uFilterFlag = 1;
        if(!$p._update) {
            filterRanges = $p.fieldDomains.slice();
            visRanges = $p.fieldDomains.slice();
        }
        var newDomains = _execute(spec);

        if(!$p._update){
            // console.log('checking filter domains', newDomains);
            newDomains.forEach(function(domain, fid) {
                var d = domain;
                if($p.dtypes[fid] == 'int') d[1] -= 1;
                $p.fieldDomains[fid] = d;
                $p.fieldWidths[fid] = $p.getDataWidth(fid, d);
            });

            $p.uniform.uFieldDomains.data = $p.fieldDomains;
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
    }

    match.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        $p.bindFramebuffer("fFilterResults");

        var gl = $p.ctx;
        var bitmap = new Uint8Array(rowSize*colSize*4);
        gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        // console.log(result.filter(function(d, i){ return i%4===0;} ));
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // var result = [];
        // bitmap.forEach(function(d, i){ if(i%3===0 && d!==0) result.push(d);});
        // console.log(result);
        // return result;
        return  bitmap;
    }

    return match;
}
