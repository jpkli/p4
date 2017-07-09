define(function(require){
    var arrays = require("p4/core/arrays"),
        colors = require('./colorManager'),
        ctypes = require('./ctypes'),
        perceive = require('./perceptual'),
        chart = require('./chart'),
        Color = require('i2v/colors'),
        bar = require('i2v/charts/column');

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

    return function visualize(fxgl) {
        var colorManager = colors(fxgl);
        var viewport = fxgl.viewport,
            padding = fxgl.padding || {left: 0, right: 0, top: 0, bottom: 0};

        var vis = new chart({
            container: fxgl.container,
            width: viewport[0] + padding.left + padding.right,
            height: viewport[1] + padding.top + padding.bottom,
            canvas: fxgl.canvas,
            padding: padding
        });

        var fieldDomains = fxgl.uniform.uFieldDomains.data;

        fxgl.visLayers = vis;

        fxgl.uniform("uVisMapPosX",     "int",   0)
            .uniform("uVisMapPosY",     "int",   0)
            .uniform("uVisMapSize",     "int",   0)
            .uniform("uVisMapColor",    "int",   0)
            .uniform("uVisMapAlpha",    "int",   0)
            .uniform("uVisDomains",     "vec2",  fieldDomains)
            .uniform("uVisLevel",      "float",  1.0)
            .uniform("uFeatureCount",   "int",   0)
            .uniform("uMarkSize",       "float", 5.0)
            .uniform("uDefaultAlpha",   "float", 1.0)
            .uniform("uMaxRGBA",        "vec4",  [0, 0, 0, 0])
            .uniform("uDefaultColor",   "vec3",  [0.8, 0, 0])
            .uniform("uViewDim",        "vec2",  fxgl.viewport)
            .varying("vColorRGBA",      "vec4"   )

        var enhance = perceive(fxgl);

        fxgl.framebuffer("offScreenFBO", "float", fxgl.viewport)
            .framebuffer("visStats", "float", [1, 1]);

        fxgl.framebuffer.enableRead("offScreenFBO");
        fxgl.subroutine(
            "visualMap",
            "float",
            function($int_fieldId, $float_rf, $float_cf, $float_v0, $float_exp){
                var value;
                if(fieldId >-1) {
                    $vec2(d);
                    d = this.uVisDomains[fieldId];
                    value = this.getData(fieldId, rf, cf);
                    value = (value - d.x) / (d.y - d.x);
                } else {
                    value = v0;
                }
                if(exp != 0.0)
                    value = pow(value, exp);
                return value;
            });

        fxgl.subroutine(
            "visualMap2",
            "float",
            function($int_fieldId, $float_rf, $float_cf, $float_v0, $float_exp){
                var value, t;
                if(fieldId >= this.uIndexCount) {
                    if (fieldId >= this.uFieldCount + this.uIndexCount) {
                        t = (float(fieldId - this.uFieldCount - this.uIndexCount) + cf) /
                            float(this.uDeriveCount);
                        value = texture2D(this.fDerivedValues, vec2(rf, t)).a;
                    } else {
                        t = (float(fieldId - this.uIndexCount) + cf) / float(this.uFieldCount);
                        value = texture2D(this.uDataInput, vec2(rf, t)).a;
                    }

                    $vec2(d);
                    d = this.uVisDomains[fieldId];
                    value = (value - d.x) / (d.y - d.x);

                } else if(fieldId > -1 && fieldId < this.uIndexCount) {
                    value = (fieldId == 0) ? rf : cf;
                } else {
                    value = v0;
                }
                if(exp != 0.0)
                    value = pow(value, exp) ;
                // value = rf;
                return value;
            });

        var vs = fxgl.shader.vertex(function(visualMap){
            var i, j;
            $vec3(rgb);
            var posX, posY, size, color, alpha;
            gl_PointSize = this.uMarkSize;
            i = (this.aIndex0+0.5) / this.uDataDim.x;
            j = (this.aIndex1+0.5) / this.uDataDim.y;

            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            posX = visualMap(this.uVisMapPosX, i, j, 0.0, 0.0);
            posY = visualMap(this.uVisMapPosY, i, j, 0.0,  0.0);
            size = visualMap(this.uVisMapSize, i, j, 1.0,  0.0);
            color = visualMap(this.uVisMapColor, i, j, -1.0,  0.0);
            alpha = visualMap(this.uVisMapAlpha, i, j, this.uDefaultAlpha, 0.0);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            if(color == -1.0)
                rgb = this.uDefaultColor;
            else
                rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
            this.vColorRGBA = vec4(rgb*alpha, alpha);
            gl_Position = vec4(posX, posY, 0.0, 1.0);
        });

        var vs2 = fxgl.shader.vertex(function(visualMap2){
            var i, j;
            $vec3(rgb);
            var posX, posY, size, color, alpha;
            gl_PointSize = this.uMarkSize;
            i = (mod(this._vid, this.uDataDim.x) + 0.5) / this.uDataDim.x;
            j = (floor(this._vid / this.uDataDim.x) + 0.5) / this.uDataDim.y;

            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            // posX = visualMap(this.uVisMapPosX, i, j, 0.0, 0.0);
            // if(this.uVisMapPosY == -1) {
                posX = this._fid.y / float(this.uFeatureCount-1);
                posY = visualMap2(int(this._fid.x), i, j, 1.0,  0.0);
            // } else {
            //     posY = this._fid.y / float(this.uFeatureCount-1);
            //     posX = visualMap2(int(this._fid.x), i, j, 1.0,  0.0);
            // }
            size = visualMap2(this.uVisMapSize, i, j, 1.0,  0.0);
            color = visualMap2(this.uVisMapColor, i, j, -1.0,  0.0);
            alpha = visualMap2(this.uVisMapAlpha, i, j, this.uDefaultAlpha, 0.0);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            if(color == -1.0)
                rgb = this.uDefaultColor;
            else
                rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
            this.vColorRGBA = vec4(rgb*alpha, alpha);

            gl_Position = vec4(posX, posY, 0.0, 1.0);
        });

        var fs = fxgl.shader.fragment(function() {
            // if(this.vResult == 0.0) discard;
            // var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
            // if (dist > 0.5) discard;
            // var delta = 0.2;
            // var alpha = 1.0 - smoothstep(0.45-delta, 0.45, dist);

            // dist = 1.0 - (dist * 2.);
            // dist = max(0., dist);
            if(this.vResult == this.uVisLevel)
                gl_FragColor = this.vColorRGBA;
            else
                discard;
        });

        fxgl.program("visualize", vs, fs);
        fxgl.program("interleave", vs2, fs);
        var svgViews = [];
        // fxgl.program("$interleave", vs2, fs);

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
                viewOrder = options.viewOrder;


            // console.log(viewOrder, offset, width, height);

            var vmapX = fields.indexOf(vmap.x),
                vmapY = fields.indexOf(vmap.y),
                vmapColor = fields.indexOf(vmap.color),
                vmapAlpha = fields.indexOf(vmap.alpha);

            var vDomain = {};
            fields.forEach(function(f, i){ vDomain[f] = domains[i];});
            // console.log(options);
            function updateInstancedAttribute(vm) {
                if(Array.isArray(vm)){
                    fxgl.uniform.uFeatureCount = vm.length;
                    var fv = new Float32Array(vm.length*2);
                    vm.forEach(function(f, i) {
                        fv[i*2] = fields.indexOf(f);
                        fv[i*2+1] = i;
                    });

                    fxgl.attribute._fid = fv;
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute._fid.location, 0);
                    fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute._vid.location, 1);
                }
            }
            updateInstancedAttribute(vmap.x);
            updateInstancedAttribute(vmap.y);

            if(Array.isArray(vmap.x) || Array.isArray(vmap.y))
                interleave = true;


            if(perceptual)
                fxgl.bindFramebuffer("offScreenFBO");
            else
                fxgl.bindFramebuffer(null);

            var gl;

            if(interleave)
                gl = fxgl.program("interleave");
            else
                gl = fxgl.program("visualize");

                fxgl.framebuffer.enableRead("fFilterResults");
                fxgl.framebuffer.enableRead("fDerivedValues");

            if(typeof data == "string")
                fxgl.uniform.uDataInput = fxgl.framebuffer[data].texture;

            fxgl.uniform.uVisMapPosX = vmapX;
            fxgl.uniform.uVisMapPosY = vmapY;

            if(vmapColor == -1 && typeof(vmap.color) == "string"){
                fxgl.uniform.uVisMapColor = vmapColor;
                fxgl.uniform.uDefaultColor = Color.rgb(vmap.color);
            } else {
                fxgl.uniform.uVisMapColor = vmapColor;
            }

            if(vmapColor == -1 && typeof(vmap.alpha) == "number") {
                fxgl.uniform.uVisMapAlpha = -1;
                fxgl.uniform.uDefaultAlpha = vmap.alpha;
            } else {
                fxgl.uniform.uVisMapAlpha = vmapAlpha;
            }
            gl.lineWidth(1.0);

            if(perceptual)
                gl.blendFunc( gl.ONE, gl.ONE );
            else
                gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);

            gl.viewport(offset[0], offset[1], width, height);

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
                var start = performance.now();
                var result = fxgl.readResult('row');
                viewSetting.data = sortData(result);
                viewSetting.fields = fields;
            }


            if(!fxgl._update) {
                domains = fxgl.uniform.uFieldDomains.data.slice();
                fxgl.uniform.uVisDomains = domains;
                svgViews[viewOrder] = vis.addLayer(viewSetting);

            } else {
                if(mark == 'bar'){
                    var result = fxgl.readResult('row');
                    svgViews[viewOrder]({
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
                if(interleave)
                    gl.ext.drawArraysInstancedANGLE(
                        primitive,
                        0,
                        fxgl.attribute._fid.data.length / fxgl.attribute._fid.size,
                        dataDim[0]* dataDim[1]
                    );
                else
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, dataDim[0], dataDim[1]);
            }

            if(mark!='bar') {
                // fxgl.uniform.uDefaultColor = vmap.color || [0.8,0.8,0.8];
                // fxgl.uniform.uVisLevel = 0;
                draw();
                // fxgl.uniform.uDefaultColor =  [0.0,0.5,0.5];
                // fxgl.uniform.uVisLevel = 1;
                // draw();
            }

            if(perceptual)
                enhance(viewport);

            if(interleave) { // change instance setting back for data processing
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0.location, 0);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0Value.location, 0);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1.location, 1);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1Value.location, 1);
            }
            fxgl.bindFramebuffer(null);

        }
        viz.chart = vis;
        return viz;

    }
});
