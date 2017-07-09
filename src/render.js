define(function(require){
    var arrays = require("p4/core/arrays"),
        perceive = require('./perceptual'),
        chart = require('./chart');

    return function visualize(fxgl) {

        var viewport = fxgl.viewport,
            padding = fxgl.padding,
            perceptual = false;

        var vis = new chart({
            container: fxgl.container,
            width: viewport[0] + padding.left + padding.right,
            height: viewport[1] +  padding.top + padding.bottom,
            canvas: fxgl.canvas,
            padding: padding,
        });

        var Color = require('i2v/colors'),
            colorResolution = 1024,
            colorGradient = new Float32Array(colorResolution * 4),
            colorTable = new Float32Array(32 * 4);

        function setColorScheme(colors) {
            var cc = colors.length - 1,
                colorTable = new Float32Array(colors.length);

            for(var i = 0; i < cc; i++) {
                var c0 = Color.rgba(colors[i]),
                    c1 = Color.rgba(colors[i+1]);

                for(var x = 0; x < colorResolution; x++) {
                    var xi = x / (colorResolution-1);
                    colorGradient[x*4] = c0[0] + (c1[0] - c0[0]) * xi;
                    colorGradient[x*4+1] = c0[1] + (c1[1] - c0[1]) * xi;
                    colorGradient[x*4+2] = c0[2] + (c1[2] - c0[2]) * xi;
                    colorGradient[x*4+3] = c0[3] + (c1[3] - c0[3]) * xi;
                }

                colorTable[i*4] = c0[0];
                colorTable[i*4+1] = c0[1];
                colorTable[i*4+2] = c0[2];
                colorTable[i*4+3] = c0[3];
            }
            var last = Color.rgba(colors[cc]);
            colorTable[cc*4] = last[0];
            colorTable[cc*4+1] = last[1];
            colorTable[cc*4+2] = last[2];
            colorTable[cc*4+3] = last[3];
        }

        fxgl.uniform("uVisMapPosX",     "int",   0)
            .uniform("uVisMapPosY",     "int",   0)
            .uniform("uVisMapSize",     "int",   0)
            .uniform("uVisMapColor",    "int",   0)
            .uniform("uVisMapAlpha",    "int",   0)
            .uniform("uVisPass",        "int",   0)
            .uniform("uMarkSize",       "float", 8.0)
            .uniform("uDefaultAlpha",   "float", 1.0)
            .uniform("uMaxRGBA",        "vec4",  [0, 0, 0, 0])
            .uniform("uViewDim",        "vec2",  fxgl.viewport)
            .varying("vColorRGBA",      "vec4"   )
            .texture("tColorGraident",  "float", colorGradient,  [colorResolution, 1], "rgba")
            .texture("tColorTable",     "float", colorTable, [32, 1], "rgba");


        var enhance = perceive(fxgl);

        fxgl.framebuffer("offScreenFBO", "float", fxgl.viewport)
            .framebuffer("visStats", "float", [1, 1]);
        console.log(fxgl.viewport);
        fxgl.framebuffer.enableRead("offScreenFBO");
        fxgl.subroutine(
            "visualMap",
            "float",
            function($int_fieldId, $float_rf, $float_cf, $float_v0){
                var t, value;
                if(fieldId > -1) {
                    $vec2(d);
                    d = this.getFieldDomain(fieldId);

                    t = (float(fieldId - this.uIndexCount) + cf) / float(this.uFieldCount);
                    value = texture2D(this.uDataInput, vec2(rf, t)).a;
                    value = (value - d.x) / (d.y - d.x);
                } else {
                    value = v0;
                }
                return value;
            });

        var vs = fxgl.shader.vertex(function(visualMap){
            var i, j;
            $vec3(rgb);
            var posX, posY, size, color, alpha;
            gl_PointSize = this.uMarkSize;
            i = (mod(this._vid, this.uDataDim.x) + 0.5) / this.uDataDim.x;
            j = (floor(this._vid / this.uDataDim.x) + 0.5) / this.uDataDim.y;
            // i += 0.5 / this.uDataDim.x;
            rgb = vec3(0.0, 0.0, 1.0);
            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            posX = visualMap(this.uVisMapPosX, i, j, 0.0);
            posY = visualMap(this.uVisMapPosY, i, j, 0.0);
            size = visualMap(this.uVisMapSize, i, j, 1.0);
            color = visualMap(this.uVisMapColor, i, j, 1.0);
            alpha = visualMap(this.uVisMapAlpha, i, j, 0.5);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            this.vColorRGBA = vec4(1.0, 0.0, 0.0, alpha);
            gl_Position = vec4(posX, posY, 0.0, 1.0);
        });

        var fs = fxgl.shader.fragment(function() {
            if(this.vResult == 0.0) discard;
            // var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
            // if (dist > 0.5) discard;
            //
            // var delta = 0.2;
            // var alpha = 1.0 - smoothstep(0.45-delta, 0.45, dist);

            // dist = 1.0 - (dist * 2.);
            // dist = max(0., dist);

            gl_FragColor = this.vColorRGBA;
        });

        fxgl.program("visualize", vs, fs);

        return function(options) {
            var vmap = options.vmap || {},
                mark = options.mark || vmap.mark || 'line',
                data = options.data || null,
                fields = options.fields,
                domains = options.domains,
                dataDim = options.dataDim,
                viewDim = options.viewport;

            var vx = fields.indexOf(vmap.x),
                vy = fields.indexOf(vmap.y);

            // vis.updateAxis({
            //     x: domains[vx],
            //     y: domains[vy]
            // });


            var t = vis.addLayer({
                domain: {x: domains[vx], y: domains[vy]},
                width: viewport[0],
                height: viewport[1]
            })

            console.log(domains, vx, vy);

            if(perceptual)
                fxgl.bindFramebuffer("offScreenFBO");

            var gl = fxgl.program("visualize");

            if(typeof data == "string")
                fxgl.uniform.uDataInput = fxgl.framebuffer[data].texture;

            var start = new Date();

            fxgl.uniform.uVisMapPosX = vx;
            fxgl.uniform.uVisMapPosY = vy;
            fxgl.uniform.uVisMapAlpha = -1;
            gl.lineWidth(1.0);
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendEquation(gl.FUNC_ADD);
            if(perceptual)
                gl.blendFunc( gl.ONE, gl.ONE );
            else
                gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);

            gl.viewport(0, 0, viewDim[0], viewDim[1]);

            var primitive;
            if(mark in ['point', 'square', 'circle'])
                primitive = gl.POINTS;
            else if(mark == 'line')
                primitive = gl.LINE_STRIP;

            // gl.ext.drawArraysInstancedANGLE(primitive, 0, dataDim[0], dataDim[1]);
            // fxgl.attribute._vid = new Float32Array(arrays.seq(0,  dataDim[0]*dataDim[1]-1));
            gl.drawArrays(primitive, 0, dataDim[0]*dataDim[1]);
            if(perceptual)
                enhance(viewDim);

            console.log("Render Time: ", new Date() - start);
        }

    }
});
