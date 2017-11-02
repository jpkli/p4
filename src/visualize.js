define(function(require){
    var colors = require('./color'),
        ctypes = require('./ctypes'),
        render = require('./render'),
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

    return function visualize($p) {

        var colorManager = colors($p),
            padding = $p.padding || {left: 0, right: 0, top: 0, bottom: 0},
            viewport = [
                $p.viewport[0],
                $p.viewport[1],
            ];

        var vis = new chart({
            container: $p.container,
            width: viewport[0] + padding.left + padding.right,
            height: viewport[1] + padding.top + padding.bottom,
            canvas: $p.canvas,
            padding: padding
        });

        var fieldDomains = $p.uniform.uFieldDomains.data;

        $p.visLayers = vis;

        $p.uniform("uVisualEncodings","int",   new Array(visualEncodings.length).fill(-1))
            .uniform("uVisDomains",     "vec2",  fieldDomains)
            .uniform("uVisLevel",       "float", 1.0)
            .uniform("uFeatureCount",   "int",   0)
            .uniform("uMarkSize",       "float", 5.0)
            .uniform("uDefaultAlpha",   "float", 1.0)
            .uniform("uDefaultWidth",   "float", 1.0 / $p.viewport[0])
            .uniform("uDefaultHeight",  "float", 1.0 / $p.viewport[1])
            .uniform("uMaxRGBA",        "vec4",  [0, 0, 0, 0])
            .uniform("uDefaultColor",   "vec3",  [0.8, 0, 0])
            .uniform("uColorMode",      "int",   1)
            .uniform("uViewDim",        "vec2",  $p.viewport)
            .uniform("uVisShape",       "int",   0)
            .varying("vColorRGBA",      "vec4"   )

        var enhance = reveal($p);

        $p.framebuffer("offScreenFBO", "float", $p.viewport)
            .framebuffer("visStats", "float", [1, 1]);

        $p.framebuffer.enableRead("offScreenFBO");

        var renderer = require('./render')($p);

        var svgViews = [];

        function updateInstancedAttribute(fields, vm) {
            if(Array.isArray(vm)){
                $p.uniform.uFeatureCount = vm.length;
                var fv = new Float32Array(vm.length*2);
                vm.forEach(function(f, i) {
                    fv[i*2] = fields.indexOf(f);
                    fv[i*2+1] = i;
                });
                $p.attribute.aDataFieldId = fv;
            }
        }

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
                interaction = options.interaction,
                viewLevel = options.viewLevel,
                categories = options.categories,
                intervals = options.intervals,
                viewOrder = options.viewOrder;


            var vmapX = fields.indexOf(vmap.x),
                vmapY = fields.indexOf(vmap.y),
                vmapColor = fields.indexOf(vmap.color),
                vmapAlpha = fields.indexOf(vmap.alpha);

            var vDomain = {},
                visMark = vmap.mark || 'point',
                renderMode = "instancedXY";

            fields.forEach(function(f, i){ vDomain[f] = domains[i]; });

            var gl;

            if(Array.isArray(vmap.x) || Array.isArray(vmap.y)) {
                renderMode = 'interleave';
            } else if(vmap.mark && vmap.mark == 'rect') {
                renderMode = 'polygon';
            }

            gl = $p.program(renderMode);

            if(perceptual && !$p._update)
                $p.bindFramebuffer("offScreenFBO");
            else
                $p.bindFramebuffer(null);


            $p.framebuffer.enableRead("fFilterResults");
            $p.framebuffer.enableRead("fDerivedValues");
            $p.framebuffer.enableRead("fGroupResults");

            if(renderMode == 'instancedXY') {
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            } else if(renderMode == 'interleave') {
                updateInstancedAttribute(fields, vmap.x);
                updateInstancedAttribute(fields, vmap.y);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
            } else {
                var val0 = new Float32Array($p.dataSize),
                    val1 = new Float32Array($p.dataSize);
                for(var y = 0; y < dataDim[1]; y++) {
                    for(var x = 0; x < dataDim[0]; x++) {
                        val0[y*dataDim[0] + x] = $p.attribute.aDataValx.data[x];
                        val1[y*dataDim[0] + x] = $p.attribute.aDataValy.data[y];
                    }
                }
                $p.attribute.aDataItemVal0 = val0;
                $p.attribute.aDataItemVal1 = val1;
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal0.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal1.location, 1);
            }

            if(typeof data == "string")
                $p.uniform.uDataInput = $p.framebuffer[data].texture;

            var vmapIndex = new Int32Array(visualEncodings.length);
            visualEncodings.forEach(function(code, codeIndex){
                vmapIndex[codeIndex] = fields.indexOf(vmap[code]);
            })

            $p.uniform.uVisualEncodings = vmapIndex;

            if(vmapIndex[2] === -1 && typeof(vmap.color) == "string"){
                $p.uniform.uDefaultColor = colorManager.rgb(vmap.color);
            }
            var opacity = vmap.opacity || vmap.alpha;
            if(typeof(opacity) == "number") {
                $p.uniform.uDefaultAlpha = opacity;
            } else {
                $p.uniform.uDefaultAlpha = 1.0;
            }

            if(!$p._update) {
                if(!vmap.width) {
                    $p.uniform.uDefaultWidth = 1.0 / (dataDim[1]-1);
                }

                if(!vmap.height) {
                    $p.uniform.uDefaultHeight = 1.0 / (dataDim[0]-1);
                }
            }


            console.log('dataDim:::::::::', dataDim);

            if(vmapIndex[2] === -1 && typeof(vmap.size) == "number") {
                $p.uniform.uMarkSize = vmap.size;
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
                var result = $p.readResult('row');
                viewSetting.data = result;
                viewSetting.fields = fields;
                if(intervals.hasOwnProperty(vmap.x))
                    viewSetting.isHistogram = true;
            }

            if(!$p._update) {
                domains = $p.uniform.uFieldDomains.data.slice();
                $p.uniform.uVisDomains = domains;
                if(svgViews[viewOrder])
                    svgViews[viewOrder].svg.remove();
                svgViews[viewOrder] = vis.addLayer(viewSetting);

            } else {
                if(mark == 'bar'){
                    var result = $p.readResult('row');
                    svgViews[viewOrder].update({
                        data: result
                    })
                }
            }

            var primitive = gl.POINTS;
            if(['rect'].indexOf(mark) !== -1) primitive = gl.TRIANGLES;
            else if(mark == 'line') primitive = gl.LINE_STRIP;

            function draw() {
                if(renderMode == 'interleave') {
                    var count = $p.attribute.aDataFieldId.data.length / $p.attribute.aDataFieldId.size,
                        primcount = $p.dataSize;
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, count, primcount);
                } else if(renderMode == 'polygon'){
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, 6, $p.dataSize);
                } else {
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, dataDim[0], dataDim[1]);
                }
            }

            if(mark!='bar') draw();

            if(perceptual && !$p._update)
                enhance(viewport);


            $p.bindFramebuffer(null);

        }
        viz.chart = vis;
        return viz;

    }
});
