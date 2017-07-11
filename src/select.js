define(function(){
    function vsFilter(){
        gl_PointSize = 1.0;

        var i, j, k, value;
        $vec2(domain);
        i = (this.aIndex0+0.5) / this.uDataDim.x;
        j = (this.aIndex1+0.5) / this.uDataDim.y;
        this.vResult = this.uMatchValue;

        for( $int(f) = 0; f < $(fieldCount)+$(indexCount); f++) {
            if(this.uFilterControls[f] == 1) {
                value = this.getData(f, i, j);
                if(value < this.uFilterRanges[f].x || value > this.uFilterRanges[f].y)
                    this.vResult = 0.0;
            }
        }

        var x = i * 2.0 - 1.0;
        var y = j * 2.0 - 1.0;

        gl_Position = vec4(x, y, 0.0, 1.0);
    }

    function vsSelect(){
        gl_PointSize = 1.0;

        var i, j, k, value;
        $vec2(domain);
        i = (this.aIndex0+0.5) / this.uDataDim.x;
        j = (this.aIndex1+0.5) / this.uDataDim.y;
        this.vResult = 0.0;

        value = this.getData(this.uFieldId, i, j);

        for($int(l) = 0; l < 500; l++){
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

    function fsWriteResult() {
        gl_FragColor = vec4(this.vResult);
    }

    return function select(fxgl, fields) {
        var select = {},
            dataDimension = fxgl.uniform.uDataDim.data,
            fieldCount = fields.length,
            fieldTotal = fxgl.uniform.uDeriveCount.data + fields.length,
            filterControls = new Array(fieldTotal).fill(0),
            filterRanges = fxgl.uniform.uFieldDomains.data.concat(
                fxgl.uniform.uDeriveDomains.data
            ),
            inSelections = new Array(500).fill(0);

        fxgl.uniform("uFilterControls","int", filterControls)
            .uniform("uFilterRanges","vec2", filterRanges)
            .uniform("uMatchValue", "float", 1.0)
            .uniform("uInSelections", "float", inSelections)
            .uniform("uSelectCount", "int", 0);

        var filter = {
            vs: fxgl.shader.vertex(vsFilter),
            fs: fxgl.shader.fragment(fsWriteResult)
        };

        var sel = {
            vs: fxgl.shader.vertex(vsSelect),
            fs: fxgl.shader.fragment(fsWriteResult)
        };

        fxgl.program("filter", filter.vs, filter.fs);
        fxgl.program("select", sel.vs, sel.fs);

        select.control = function(ctrl) {
            filterControls = ctrl;
        }

        select.execute = function(spec, fields){
            var gl;
            var selectFields = Object.keys(spec).filter(function(s){
                return spec[s].hasOwnProperty('$in');
            });
            fxgl.bindFramebuffer("fFilterResults");
            if(selectFields.length) {

                gl = fxgl.program("select");
                gl.viewport(0, 0, dataDimension[0], dataDimension[1]);

                gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.enable( gl.BLEND );
                gl.blendFunc( gl.ONE, gl.ONE );
                gl.blendEquation(gl.MIN_EXT);

                selectFields.forEach(function(k){
                    var fieldId = fields.indexOf(k);
                    spec[k].$in.forEach(function(v, i){
                        if(i<500) inSelections[i] = v;
                    });
                    fxgl.uniform.uSelectCount = spec[k].$in.length;
                    fxgl.uniform.uInSelections = inSelections;
                    fxgl.uniform.uFieldId = fieldId;
                    gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                    filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                    filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
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
                    filterControls[fieldId] = 1;
                    filterRanges[fieldId*2] = spec[k][0];
                    filterRanges[fieldId*2+1] = spec[k][1];
                });

                fxgl.uniform.uFilterControls = filterControls;
                fxgl.uniform.uFilterRanges= filterRanges;

                gl = fxgl.program("filter");
                gl.disable(gl.BLEND);
                // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

                gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            }
            fxgl.bindFramebuffer(null);
            return filterRanges;
        }

        select.result = function() {
            fxgl.bindFramebuffer("fFilterResults");
            var gl = fxgl.ctx;
            var bitmap = new Uint8Array(dataDimension[0]*dataDimension[1]*4);
            gl.readPixels(0, 0, dataDimension[0], dataDimension[1], gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
            // console.log(result.filter(function(d, i){ return i%4===0;} ));
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            var result = [];
            bitmap.forEach(function(d, i){ if(i%4===0 && d!==0) result.push(i/4);});
            return result;
        }

        return select;
    }
})
