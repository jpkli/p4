define(function(require){
    var colors = require('./color'),
        ctypes = require('./ctypes'),
        render = require('./render'),
        reveal = require('./reveal');

    const Chart = require('./chart/chart');
    const Brush = require('./chart/brush');

    const interact = require('./interact');

    const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];

    const encode =require('./encode');
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

        $p.uniform('uVisualEncodings',  'int',   new Array(visualEncodings.length).fill(-1))
            .uniform('uViewDim',        'vec2',  $p.viewport)
            .uniform('uVisShape',       'int',   1)
            .uniform('uInterleaveX',    'int',   0)
            .uniform('uVisDomains',     'vec2',  $p.fieldDomains)
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

        $p.framebuffer('offScreenFBO', 'float', $p.viewport);
        $p.framebuffer('visStats', 'float', [1, 1]);

        // $p.framebuffer.enableRead('offScreenFBO');
        $p.renderMode = 'instancedXY';

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
            $p.renderMode = 'instancedXY';
            $p.revealDensity = false;
            var vmap = options.vmap || {},
                mark = options.mark || vmap.mark || 'line',
                data = options.data || null,
                interaction = options.interaction,
                viewOrder = options.viewOrder;

            var visDomain = {},
                visDimension = vmap.viewport || [$p.views[viewOrder].width, $p.views[viewOrder].height] || viewport;

            var width = visDimension[0],
                height =  visDimension[1],
                offset = $p.views[viewOrder].offset || [0, 0];

            $p.fields.forEach(function(f, i){
                visDomain[f] = $p.fieldDomains[i].slice();
                if(vmap.zero && visDomain[f][0]>0) visDomain[f][0] = 0;
                visDomain[f][0] *= $p.uniform.uVisScale.data[0];
                visDomain[f][1] *= $p.uniform.uVisScale.data[1];
            });

            var vmapIndex = encode($p, vmap, colorManager);

            var gl = $p.program($p.renderMode);
            $p.framebuffer.enableRead('fFilterResults');
            $p.framebuffer.enableRead('fDerivedValues');
            $p.framebuffer.enableRead('fGroupResults');

            if($p.renderMode == 'instancedXY') {
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
                $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            } else if($p.renderMode == 'interleave') {
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

            if($p.revealDensity) {
                $p.bindFramebuffer('offScreenFBO');
                gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
                gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
                gl.blendFunc(gl.ONE, gl.ONE );
            } else {
                $p.bindFramebuffer(null);
                // gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
                gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
                // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
            }

            gl.viewport(
                offset[0],
                offset[1],
                width-padding.left-padding.right,
                height-padding.top-padding.bottom
            );
            gl.lineWidth(1.0);

            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendEquation(gl.FUNC_ADD);

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
                viewSetting.data = result.filter(d=>d[vmap.y]>0);
                viewSetting.fields = $p.fields;
                if($p.intervals.hasOwnProperty(vmap.x))
                    viewSetting.isHistogram = true;
            }

            //TODO: Maybe just save the needed data domains instead of copying all
            if(!$p._update) {
                var pv = $p.views[viewOrder];
                pv.domains = Object.keys(visDomain).map(f=>visDomain[f]);
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
                if($p.renderMode == 'interleave') {
                    var count = $p.attribute.aDataFieldId.data.length / $p.attribute.aDataFieldId.size,
                        primcount = $p.dataSize;
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, count, primcount);
                } else if($p.renderMode == 'polygon'){
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, 6, $p.dataSize);
                } else {
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);
                }
            }
            if($p._update && vmap.hasOwnProperty('brush')) {
                $p.uniform.uVisLevel = 0.1;
                if(typeof(vmap.brush) == 'object') {
                    $p.uniform.uDefaultColor = colorManager.rgb(vmap.brush.unselected.color);
                } else  {
                    $p.uniform.uDefaultColor = colorManager.rgb('lightgrey');
                }
                // if($p.revealDensity) enhance([width, height]);
                if(mark !='bar' ) draw();
                $p.uniform.uVisLevel = 0.2;
                if(typeof vmap.color == 'string')
                    $p.uniform.uDefaultColor = colorManager.rgb(vmap.color);
            } else {
                $p.uniform.uVisLevel = 0.1;
            }

            if(mark!='bar') draw();

            if($p.revealDensity) enhance([width, height]);
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
