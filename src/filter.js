define(function(){
    function vsFilter(){
        gl_PointSize = 1.0;

        var i, j, k, value;
        $vec2(domain);
        i = (this.aIndex0+0.5) / this.uDataDim.x;
        j = (this.aIndex1+0.5) / this.uDataDim.y;
        this.vResult = 1.0;
        // if(this.uIndexCount > 0) {
        //     if(this.uFilterControls[0] == 1) {
        //         domain = this.getFieldDomain(0);
        //         if(this.aIndex0Value < domain.x || this.aIndex0Value > domain.y)
        //             this.vResult = 0.0;
        //     }
        //     if(this.uFilterControls[1] == 1) {
        //         domain = this.getFieldDomain(1);
        //         if(this.aIndex1Value < domain.x || this.aIndex1Value > domain.y)
        //             this.vResult = 0.0;
        //     }
        // }

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

    function fsWriteFilterResult() {
        // if(this.vResult == 0.0) discard;
        gl_FragColor = vec4(this.vResult);
    }

    return function optFilter(fxgl, fields) {
        var filter = {},
            dataDimension = fxgl.uniform.uDataDim.data,
            fieldCount = fields.length,
            fieldTotal = fxgl.uniform.uDeriveCount.data + fields.length,
            filterControls = new Array(fieldTotal).fill(0),
            filterRanges = fxgl.uniform.uFieldDomains.data.concat(
                fxgl.uniform.uDeriveDomains.data
            );

        fxgl.uniform("uFilterControls","int", filterControls)
            .uniform("uFilterRanges","vec2", filterRanges);

        var vs = fxgl.shader.vertex(vsFilter),
            fs = fxgl.shader.fragment(fsWriteFilterResult);

        fxgl.program("filter", vs, fs);

        filter.control = function(ctrl) {
            filterControls = ctrl;
        }

        filter.execute = function(spec, fields){
            filterControls = new Array(fieldTotal).fill(0);
            Object.keys(spec).forEach(function(k){
                var fieldId = fields.indexOf(k);
                if(fieldId === -1) throw new Error('Invalid data field ' + k);
                filterControls[fieldId] = 1;
                // filterRanges[fieldId] = spec[k];
                filterRanges[fieldId*2] = spec[k][0];
                filterRanges[fieldId*2+1] = spec[k][1];
            });
            // console.log(Object.keys(spec), filterRanges, filterControls);
            fxgl.uniform.uFilterControls = filterControls;
            fxgl.uniform.uFilterRanges= filterRanges;
            // fxgl.uniform.uFilterFlag = 1;
            // fxgl.uniform.uFieldDomains = filterRanges.slice(0, fieldCount);
            // fxgl.uniform.uDeriveDomains = filterRanges.slice(fieldCount);
            //
            // console.log(filterRanges);
            var gl = fxgl.program("filter");

            fxgl.bindFramebuffer("fFilterResults");

            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.BLEND);
            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            return filterRanges;
        }

        filter.result = function() {
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

        return filter;
    }
})
