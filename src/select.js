define(function(){
    // 'use strict';
    function vertexShaderFilter(){
        gl_PointSize = 1.0;

        var i, j, k, value;
        var domain = new Vec2();
        i = (this.aDataIdx+0.5) / this.uDataDim.x;
        j = (this.aDataIdy+0.5) / this.uDataDim.y;
        this.vResult = 1.0;

        for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
            if(this.uFilterControls[f] == 1) {
                value = this.getData(f, i, j);
                if(value <= this.uFilterRanges[f].x || value > this.uFilterRanges[f].y) {
                    this.vResult = 0.0;
                }
            }
        }

        var x = i * 2.0 - 1.0;
        var y = j * 2.0 - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
    }

    function vertexShaderSelect(){
        gl_PointSize = 1.0;

        var i, j, k, value;
        var domain = new Vec2();
        i = (this.aDataIdx+0.5) / this.uDataDim.x;
        j = (this.aDataIdy+0.5) / this.uDataDim.y;
        this.vResult = 0.0;

        value = this.getData(this.uFieldId, i, j);

        for(var l = 0; l < 500; l++){
            if(l < this.uSelectCount) {
                if(value == this.uInSelections[l]) {
                    this.vResult = 1.0;
                }
            }
        }

        var x = i * 2.0 - 1.0;
        var y = j * 2.0 - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
    }

    function fragmentShader() {
        gl_FragColor = vec4(this.vResult);
    }

    return function program(context) {
        const SELECT_MAX = 500;
        var select = {},
            fields = context.fields,
            dataDimension = context.uniform.uDataDim.data,
            fieldCount = fields.length,
            fieldTotal = context.uniform.uDeriveCount.data + fields.length,
            filterControls = new Array(fieldTotal).fill(0),
            filterRanges = context.fieldDomains.concat(
                context.deriveDomains
            ),
            inSelections = new Array(SELECT_MAX);

        context.uniform("uFilterControls","int", filterControls)
            .uniform("uFilterRanges","vec2", filterRanges)
            .uniform("uMatchValue", "float", 1.0)
            .uniform("uInSelections", "float", Float32Array.from(inSelections))
            .uniform("uSelectMax", "int", SELECT_MAX)
            .uniform("uSelectCount", "int", 0);

        // context.env({
        //     selectMax: SELECT_MAX
        // })

        var filter = {
            vs: context.shader.vertex(vertexShaderFilter),
            fs: context.shader.fragment(fragmentShader)
        };

        var sel = {
            vs: context.shader.vertex(vertexShaderSelect),
            fs: context.shader.fragment(fragmentShader)
        };

        context.program("filter", filter.vs, filter.fs);
        context.program("select", sel.vs, sel.fs);

        select.control = function(ctrl) {
            filterControls = ctrl;
        }

        function _execute(spec){
            var fields = context.fields
            var gl;
            var selectFields = Object.keys(spec).filter(function(s){
                return spec[s].hasOwnProperty('$in');
            });
            context.bindFramebuffer("fFilterResults");
            context.framebuffer.enableRead("fDerivedValues");
            context.ctx.ext.vertexAttribDivisorANGLE(context.attribute.aDataIdy.location, 1);
            context.ctx.ext.vertexAttribDivisorANGLE(context.attribute.aDataValy.location, 1);
            if(selectFields.length) {
                console.log(dataDimension);
                gl = context.program("select");
                gl.viewport(0, 0, dataDimension[0], dataDimension[1]);

                gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.enable( gl.BLEND );
                gl.blendFunc( gl.ONE, gl.ONE );
                gl.blendEquation(gl.MIN_EXT);

                selectFields.forEach(function(k){
                    var fieldId = fields.indexOf(k);


                    if(context.categoryIndex.hasOwnProperty(k)) {
                        inSelections = spec[k].$in
                        .slice(0, SELECT_MAX)
                        .map(function(v) { return context.categoryIndex[k][v]; });
                    } else {
                        inSelections = spec[k].$in.slice(0, SELECT_MAX);
                    }

                    console.log(inSelections);

                    context.uniform.uSelectCount = spec[k].$in.length;
                    context.uniform.uInSelections = Float32Array.from(inSelections);
                    context.uniform.uFieldId = fieldId;

                    gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                    // filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                    // filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
                    filterRanges[fieldId] = [Math.min.apply(null, inSelections), Math.max.apply(null, inSelections)];
                })
            }

            var filterSelections = Object.keys(spec).filter(function(s){
                return !spec[s].hasOwnProperty('$in');
            });

            if(filterSelections.length){
                filterControls = new Array(fieldTotal).fill(0);

                filterSelections.forEach(function(k){
                    var fieldId = fields.indexOf(k);

                    if(fieldId === -1) throw new Error('Invalid data field ' + k);
                    if(spec[k].length < 2) spec[k][1] = spec[k][0];
                    filterControls[fieldId] = 1;
                    filterRanges[fieldId] = spec[k];
                    // filterRanges[fieldId*2] = spec[k][0];
                    // filterRanges[fieldId*2+1] = spec[k][1];
                });


                context.uniform.uFilterControls = filterControls;
                context.uniform.uFilterRanges= filterRanges;

                gl = context.program("filter");
                gl.disable(gl.BLEND);
                // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

                gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            }
            context.ctx.bindFramebuffer(context.ctx.FRAMEBUFFER, null);
            return filterRanges;
        }

        select.execute = function(spec) {
            var filterSpec = spec;

            Object.keys(context.crossfilters).forEach(function(c){
                filterSpec[c] = context.crossfilters[c];
            });

            Object.keys(filterSpec).forEach(function(k, i) {
                if(context.categoryIndex.hasOwnProperty(k) && !spec[k].$in) {
                    spec[k] = {$in: spec[k]};
                }
            });

            context.uniform.uFilterFlag = 1;
            filterRanges = context.fieldDomains.concat(
                context.deriveDomains
            );
            var newDomains = _execute(spec);
            console.log(newDomains);
            if(!context._update){
                newDomains.forEach(function(range, fid) {
                    if (fid < context.fieldCount + context.indexes.length) {
                        context.fieldDomains[fid] = range;
                        context.fieldWidths[fid] = context.getDataWidth(fid, range);
                    } else {
                        var di = fid - context.fieldCount - context.indexes.length;
                        context.deriveDomains[di] = range;
                        context.deriveWidths[di] = range[1] - range[0] + 1;
                    }
                });

                context.uniform.uFieldDomains.data = context.fieldDomains;
                context.uniform.uFieldWidths.data = context.fieldWidths;
                context.uniform.uDeriveDomains.data = context.deriveDomains;
                context.uniform.uDeriveWidths.data = context.deriveWidths;
            }
        }

        select.result = function(arg) {
            var options = arg || {},
                offset = options.offset || [0, 0],
                resultSize = options.size || context.dataDimension[0]* context.dataDimension[1],
                rowSize = Math.min(resultSize, context.dataDimension[0]),
                colSize = Math.ceil(resultSize/context.dataDimension[0]);

            context.bindFramebuffer("fFilterResults");

            var gl = context.ctx;
            var bitmap = new Uint8Array(rowSize*colSize*4);
            gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
            // console.log(result.filter(function(d, i){ return i%4===0;} ));
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // var result = [];
            // bitmap.forEach(function(d, i){ if(i%4===0 && d!==0) result.push(i/4);});
            // console.log(dataDimension, result.length, bitmap.length /4);
            // return result;
            return  bitmap;
        }

        return select;
    }
})
