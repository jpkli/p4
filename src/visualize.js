define(function(require){
    var colors = require('./color'),
        ctypes = require('./ctypes'),
        reveal = require('./reveal'),
        chart = require('./chart/chart');

    const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size']

    function seq(dtype, start, end, interval) {
        var step = interval || 1,
            size = (end - start) / step + 1,
            buf;

        buf = new ctypes[dtype](size);
        for(var i = 0; i < size; i++) {
            buf[i] = start + i * step;
        }
        return buf;
    }

    var seqInt = seq.bind(null, "int"),
        seqFloat = seq.bind(null, "float");

    // var contRenderer = require('./renderer/contiguous'),
    //     intlRenderer = require('./renderer/interleave');

    return function visualize(fxgl) {

        var colorManager = colors(fxgl),
            padding = fxgl.padding || {left: 0, right: 0, top: 0, bottom: 0},
            viewport = [
                fxgl.viewport[0],
                fxgl.viewport[1],
            ];

        var vis = new chart({
            container: fxgl.container,
            width: viewport[0] + padding.left + padding.right,
            height: viewport[1] + padding.top + padding.bottom,
            canvas: fxgl.canvas,
            padding: padding
        });

        var fieldDomains = fxgl.uniform.uFieldDomains.data;

        fxgl.visLayers = vis;

        fxgl.uniform("uVisualEncodings","int",   new Array(visualEncodings.length).fill(-1))
            .uniform("uVisDomains",     "vec2",  fieldDomains)
            .uniform("uVisLevel",       "float", 1.0)
            .uniform("uFeatureCount",   "int",   0)
            .uniform("uMarkSize",       "float", 5.0)
            .uniform("uDefaultAlpha",   "float", 1.0)
            .uniform("uMaxRGBA",        "vec4",  [0, 0, 0, 0])
            .uniform("uDefaultColor",   "vec3",  [0.8, 0, 0])
            .uniform("uColorMode",      "int",   1)
            .uniform("uViewDim",        "vec2",  fxgl.viewport)
            .uniform("uVisShape",       "int",   0)
            .varying("vColorRGBA",      "vec4"   )

        var enhance = reveal(fxgl);

        fxgl.framebuffer("offScreenFBO", "float", fxgl.viewport)
            .framebuffer("visStats", "float", [1, 1]);

        fxgl.framebuffer.enableRead("offScreenFBO");

        var renderer = require('./render')(fxgl);

        // var renderer = {
        //     contig: contRenderer(fxgl),
        //     interleave: intlRenderer(fxgl)
        // };
        //
        // fxgl.subroutine(
        //     renderer.contig.visualMap.fname,
        //     renderer.contig.visualMap.returnType,
        //     renderer.contig.visualMap
        // );
        //
        // fxgl.subroutine(
        //     renderer.interleave.visualMap.fname,
        //     renderer.interleave.visualMap.returnType,
        //     renderer.interleave.visualMap
        // );
        //
        // var vs1 = fxgl.shader.vertex(renderer.contig.vs),
        //     fs1 = fxgl.shader.fragment(renderer.contig.fs);
        //
        // fxgl.program("visualize", vs1, fs1);
        //
        // var vs2 = fxgl.shader.vertex(renderer.interleave.vs),
        //     fs2 = fxgl.shader.fragment(renderer.interleave.fs);
        // fxgl.program("interleave", vs2, fs2);
        //
        var svgViews = [];

        var viz = function(options) {
            var vmap = options.vmap || {},
                mark = options.mark || vmap.mark || 'line',
                data = options.data || null,
                fields = options.fields,
                domains = options.domains,
                dataDim = options.dataDim,
                width = options.width || viewport[0],
                height = options.height || viewport[1],
                offset = options.offset || [0, 0],
                perceptual = vmap.perceptual || false,
                update = vmap.update || false,
                interleave = false,
                interaction = options.interaction,
                viewLevel = options.viewLevel,
                categories = options.categories,
                intervals = options.intervals,
                viewOrder = options.viewOrder;


            var vmapX = fields.indexOf(vmap.x),
                vmapY = fields.indexOf(vmap.y),
                vmapColor = fields.indexOf(vmap.color),
                vmapAlpha = fields.indexOf(vmap.alpha);

            var vDomain = {};
            fields.forEach(function(f, i){ vDomain[f] = domains[i];});
            // console.log(options);

            if(Array.isArray(vmap.x) || Array.isArray(vmap.y))
                interleave = true;

            if(perceptual && !fxgl._update)
                fxgl.bindFramebuffer("offScreenFBO");
            else
                fxgl.bindFramebuffer(null);

            var gl;

            if(interleave)
                gl = fxgl.program("interleave");
            else
                gl = fxgl.program("instancedXY");

            fxgl.framebuffer.enableRead("fFilterResults");
            fxgl.framebuffer.enableRead("fDerivedValues");
            fxgl.framebuffer.enableRead("fGroupResults");

            function updateInstancedAttribute(vm) {
                if(Array.isArray(vm)){
                    fxgl.uniform.uFeatureCount = vm.length;
                    var fv = new Float32Array(vm.length*2);
                    vm.forEach(function(f, i) {
                        fv[i*2] = fields.indexOf(f);
                        fv[i*2+1] = i;
                    });

                    fxgl.attribute.aDataFieldId = fv;
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataFieldId.location, 0);
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataItemId.location, 1);
                } else {
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdx.location, 0);
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValx.location, 0);
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdy.location, 1);
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValy.location, 1);
                }
            }
            updateInstancedAttribute(vmap.x);
            updateInstancedAttribute(vmap.y);

            if(typeof data == "string")
                fxgl.uniform.uDataInput = fxgl.framebuffer[data].texture;

            var vmapIndex = new Int32Array(visualEncodings.length);
            visualEncodings.forEach(function(code, codeIndex){
                vmapIndex[codeIndex] = fields.indexOf(vmap[code]);
            })

            fxgl.uniform.uVisualEncodings = vmapIndex;

            console.log(vmapIndex);
            if(vmapIndex[2] === -1 && typeof(vmap.color) == "string"){
                console.log(vmap.color);
                fxgl.uniform.uDefaultColor = colorManager.rgb(vmap.color);
            }

            if(typeof(vmap.alpha) == "number" || typeof(vmap.opacity) == "number") {
                fxgl.uniform.uDefaultAlpha = vmap.alpha;
            } else {
                fxgl.uniform.uDefaultAlpha = 1.0;
            }
            gl.lineWidth(1.0);

            if(perceptual)
                gl.blendFunc( gl.ONE, gl.ONE );
            else
                gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);

            gl.viewport(
                offset[0],
                offset[1],
                width-padding.left-padding.right,
                height-padding.top-padding.bottom
            );

            // clear screen
            // if(viewOrder == 0) {
            //     gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            //     gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            // }

            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendEquation(gl.FUNC_ADD);

            var viewSetting = {
                domain: vDomain,
                width: width,
                height: height,
                vmap: vmap,
                onclick: interaction,
                categories: categories,
                left: offset[0],
                top: viewport[1] - height - offset[1]
            };

            function sortData(data) {
                return data.sort(function(a,b){
                    if(typeof(a[vmap.x]) == 'string')
                        return a[vmap.x] > b[vmap.x];
                    else
                        return a[vmap.x] - b[vmap.x];
                })
            }

            if(mark == 'bar') {
                var result = fxgl.readResult('row');
                viewSetting.data = result;
                viewSetting.fields = fields;
                if(intervals.hasOwnProperty(vmap.x))
                    viewSetting.isHistogram = true;
            }

            if(!fxgl._update) {
                domains = fxgl.uniform.uFieldDomains.data.slice();
                fxgl.uniform.uVisDomains = domains;
                if(svgViews[viewOrder])
                    svgViews[viewOrder].svg.remove();
                svgViews[viewOrder] = vis.addLayer(viewSetting);

            } else {
                if(mark == 'bar'){
                    var result = fxgl.readResult('row');
                    svgViews[viewOrder].update({
                        data: sortData(result)
                    })
                }
            }

            var primitive;
            if(mark in ['point', 'square', 'circle'])
                primitive = gl.POINTS;
            else if(mark == 'line')
                primitive = gl.LINE_STRIP;

            function draw() {
                if(interleave) {
                    var count = fxgl.attribute.aDataFieldId.data.length / fxgl.attribute.aDataFieldId.size,
                        primcount = fxgl.dataSize;
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, count, primcount);
                } else {
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, dataDim[0], dataDim[1]);
                }
            }

            if(mark!='bar') {
                // fxgl.uniform.uDefaultColor = vmap.color || [0.8,0.8,0.8];
                // fxgl.uniform.uVisLevel = 0;
                draw();
                // fxgl.uniform.uDefaultColor =  [0.0,0.5,0.5];
                // fxgl.uniform.uVisLevel = 1;
                // draw();
            }

            if(perceptual && !fxgl._update)
                enhance(viewport);

            if(interleave) { // change instance setting back for data processing
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdx.location, 0);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValx.location, 0);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdy.location, 1);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValy.location, 1);
            }
            fxgl.bindFramebuffer(null);

        }
        viz.chart = vis;
        return viz;

    }
});
