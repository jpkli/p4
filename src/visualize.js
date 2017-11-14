define(function(require){
    var colors = require('./color'),
        ctypes = require('./ctypes'),
        render = require('./render'),
        reveal = require('./reveal');

    const Chart = require('./chart/chart');
    const Brush = require('./chart/brush');

    const interact = require('./interact');

    const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];
    const userActions = ['click', 'hover', 'brush', 'zoom', 'pan']

    return function ($p) {

        var colorManager = colors($p),
            padding = $p.padding || {left: 0, right: 0, top: 0, bottom: 0},
            viewport = [
                $p.viewport[0],
                $p.viewport[1],
            ];

        var vis = new Chart({
            container: $p.container,
            width: viewport[0] + padding.left + padding.right,
            height: viewport[1] + padding.top + padding.bottom,
            canvas: $p.canvas,
            padding: padding
        });

        // $p.visLayers = vis;
        $p.uniform('uVisualEncodings','int',   new Array(visualEncodings.length).fill(-1))
            .uniform('uViewDim',        'vec2',  $p.viewport)
            .uniform('uVisShape',       'int',   1)
            .uniform('uInterleaveX',    'int',   0)
            .uniform('uVisDomains',     'vec2',  $p.fieldDomains)
            .uniform('uVisLevel',       'float', 1.0)
            .uniform('uVisScale',       'vec2', [1.0, 1.0])
            .uniform('uPosOffset',      'vec2', [0.0, 0.0])
            .uniform('uFeatureCount',   'int',   0)
            .uniform('uMarkSize',       'float', 10.0)
            .uniform('uDefaultAlpha',   'float', 1.0)
            .uniform('uDefaultWidth',   'float', 1.0 / $p.viewport[0])
            .uniform('uDefaultHeight',  'float', 1.0 / $p.viewport[1])
            .uniform('uMaxRGBA',        'vec4',  [0, 0, 0, 0])
            .uniform('uDefaultColor',   'vec3',  [0.8, 0, 0])
            .uniform('uColorMode',      'int',   1)
            .varying('vColorRGBA',      'vec4'   )

        var enhance = reveal($p);

        $p.framebuffer('offScreenFBO', 'float', $p.viewport)
            .framebuffer('visStats', 'float', [1, 1]);

        $p.framebuffer.enableRead('offScreenFBO');

        var renderer = require('./render')($p);

        function updateInstancedAttribute(vm) {
            if(Array.isArray(vm)){
                $p.uniform.uFeatureCount = vm.length;
                var fv = new Float32Array(vm.length*2);
                vm.forEach(function(f, i) {
                    fv[i*2] = $p.fields.indexOf(f);
                    fv[i*2+1] = i;
                });
                $p.attribute.aDataFieldId = fv;
            }
        }

        var viz = function(options) {
            var vmap = options.vmap || {},
                mark = options.mark || vmap.mark || 'line',
                data = options.data || null,
                perceptual = vmap.perceptual || false,
                interaction = options.interaction,
                viewOrder = options.viewOrder;

            var visDimension = vmap.viewport || [$p.views[viewOrder].width, $p.views[viewOrder].height] || viewport,
                width = visDimension[0],
                height =  visDimension[1],
                offset = $p.views[viewOrder].offset || [0, 0];


            var visDomain = {},
                visMark = vmap.mark || 'point',
                renderMode = 'instancedXY';

            $p.fields.forEach(function(f, i){
                visDomain[f] = $p.fieldDomains[i].slice();
                visDomain[f][0] *= $p.uniform.uVisScale.data[0];
                visDomain[f][1] *= $p.uniform.uVisScale.data[1];
            });

            var gl;

            if(Array.isArray(vmap.x) || Array.isArray(vmap.y)) {
                renderMode = 'interleave';
                if(Array.isArray(vmap.x)){
                    // vmap.x = vmap.x.reverse();
                    $p.uniform.uInterleaveX = 0;
                }
                if(Array.isArray(vmap.y)) $p.uniform.uInterleaveX = 1;
            } else if(vmap.mark && vmap.mark == 'rect') {
                renderMode = 'polygon';
            }

            gl = $p.program(renderMode);
            $p.framebuffer.enableRead('fFilterResults');
            $p.framebuffer.enableRead('fDerivedValues');
            $p.framebuffer.enableRead('fGroupResults');

            if(renderMode == 'instancedXY') {
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            } else if(renderMode == 'interleave') {
                updateInstancedAttribute(vmap.x);
                updateInstancedAttribute(vmap.y);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
            } else {
                var val0 = new Float32Array($p.dataSize),
                    val1 = new Float32Array($p.dataSize);
                for(var y = 0; y < $p.dataDimension[1]; y++) {
                    for(var x = 0; x < $p.dataDimension[0]; x++) {
                        val0[y*$p.dataDimension[0] + x] = $p.attribute.aDataValx.data[x];
                        val1[y*$p.dataDimension[0] + x] = $p.attribute.aDataValy.data[y];
                    }
                }
                $p.attribute.aDataItemVal0 = val0;
                $p.attribute.aDataItemVal1 = val1;
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal0.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal1.location, 1);
            }

            if(typeof data == 'string')
                $p.uniform.uDataInput = $p.framebuffer[data].texture;

            var vmapIndex = new Int32Array(visualEncodings.length);
            visualEncodings.forEach(function(code, codeIndex){
                vmapIndex[codeIndex] = $p.fields.indexOf(vmap[code]);
            })

            $p.uniform.uVisualEncodings = vmapIndex;

            if(vmapIndex[2] === -1 && typeof(vmap.color) === 'string'){
                if(vmap.color === 'auto') {
                    perceptual = true;
                    $p.uniform.uRevealMode.data = 1;
                } else {
                    $p.uniform.uDefaultColor = colorManager.rgb(vmap.color);
                }
            }
            var opacity = vmap.opacity || vmap.alpha;
            if(typeof(opacity) === 'number') {
                $p.uniform.uDefaultAlpha = opacity;
            } else if(vmapIndex[3] === -1 && typeof(opacity) == 'string' && opacity == 'auto' ) {
                perceptual = true;
                $p.uniform.uRevealMode.data = 0;
            } else {
                $p.uniform.uDefaultAlpha = 1.0;
            }

            if(!$p._update) {
                if(!vmap.width && vmap.x) {
                    $p.uniform.uDefaultWidth = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)] );
                } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
                    $p.uniform.uDefaultWidth = vmap.width / width;
                }

                if(!vmap.height && vmap.y) {
                    $p.uniform.uDefaultHeight = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)] );
                } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
                    $p.uniform.uDefaultHeight = vmap.height / height;
                }
            }

            if(vmapIndex[2] === -1 && typeof(vmap.size) == 'number') {
                $p.uniform.uMarkSize = vmap.size;
            }


            if(perceptual)
                $p.bindFramebuffer('offScreenFBO');
            else
                $p.bindFramebuffer(null);

            gl.lineWidth(1.0);

            gl.viewport(
                offset[0],
                offset[1],
                width-padding.left-padding.right,
                height-padding.top-padding.bottom
            );


            if(perceptual) {
                gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.blendFunc( gl.ONE, gl.ONE );
            } else {
                // gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
                gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
            }


            // clear screen
            // if(viewOrder == 0) {
                // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
                // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            // }

            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendEquation(gl.FUNC_ADD);

            var viewSetting = {
                domain: visDomain,
                width: width,
                height: height,
                vmap: vmap,
                onclick: interaction,
                categories: $p.categoryLookup,
                left: offset[0],
                top: viewport[1] - height - offset[1]
            };

            if (mark == 'rect') {
                if(vmapIndex[0] > -1) {
                    var len = $p.fieldWidths[vmapIndex[0]],
                        ext = $p.fieldDomains[vmapIndex[0]];
                    viewSetting.scaleX = 'ordinal';
                    if($p.categoryLookup.hasOwnProperty(vmap.x)){
                         viewSetting.domainX = new Array(len).fill(0).map(
                             (d,i)=>$p.categoryLookup[vmap.x][i]
                         );
                     } else {
                         viewSetting.domainX = new Array(len).fill(0).map((d,i)=>ext[0] + i);
                     }
                }
                if(vmapIndex[1] > -1) {
                    var len = $p.fieldWidths[vmapIndex[1]],
                        ext = $p.fieldDomains[vmapIndex[1]];
                    viewSetting.scaleY = 'ordinal';
                    if($p.categoryLookup.hasOwnProperty(vmap.y)){
                         viewSetting.domainY = new Array(len).fill(0).map(
                             (d,i)=>$p.categoryLookup[vmap.y][i]
                         ).reverse();
                    } else {
                        viewSetting.domainY = new Array(len).fill(0).map((d,i)=>ext[0] + i).reverse();
                    }
                }
            }

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
                viewSetting.fields = $p.fields;
                if($p.intervals.hasOwnProperty(vmap.x))
                    viewSetting.isHistogram = true;
            }
            // console.log('vis domain ::::', $p.uniform.uVisDomains.data);
            //                 $p.uniform.uVisDomains = $p.uniform.uFieldDomains.data.slice();

            //TODO: Maybe just save the needed data domains instead of copying all
            if(!$p._update) {
                var pv = $p.views[viewOrder];
                pv.domains = $p.uniform.uFieldDomains.data.slice();
                $p.uniform.uVisDomains = pv.domains;

                if(pv.hasOwnProperty('chart') && typeof pv.chart.svg.remove == 'function')
                    pv.chart.svg.remove();
                pv.chart = vis.addLayer(viewSetting);

            } else {
                $p.uniform.uVisDomains = $p.views[viewOrder].domains;
                if(mark == 'bar'){
                    var result = $p.readResult('row');
                    $p.views[viewOrder].chart.update({
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
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);
                }
            }

            if(mark!='bar') draw();
            if(perceptual) enhance([width, height]);
            $p.bindFramebuffer(null);

            if(!$p._update) {
                var actions = Object.keys(vmap)
                    .filter(function(act){ return userActions.indexOf(act) !== -1});

                interact($p, {
                    actions: actions,
                    vis: $p.views[viewOrder],
                    callback: interaction
                });

            }
        }

        viz.chart = vis;
        return viz;
    }
});
