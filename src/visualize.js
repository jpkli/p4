import colors from './color';
import ctypes from './ctypes';
import render from './render';
import reveal from './reveal';
import encode from './encode';
import interact from './interact';

import Layout from './metavis/layout';

const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];
const userActions = ['click', 'hover', 'brush', 'zoom', 'pan'];

export default function visualize($p) {

    var colorManager = colors($p),
        chartPadding = $p.padding || {left: 0, right: 0, top: 0, bottom: 0},
        viewport = [
            $p.viewport[0],
            $p.viewport[1],
        ];

    var vis = new Layout({
        container: $p.container,
        width: viewport[0] + chartPadding.left + chartPadding.right,
        height: viewport[1] + chartPadding.top + chartPadding.bottom,
        canvas: $p.canvas,
        padding: chartPadding
    });

    $p.uniform('uVisualEncodings',  'int',   new Array(visualEncodings.length).fill(-1))
        .uniform('uViewDim',        'vec2',  $p.viewport)
        .uniform('uVisShape',       'int',   1)
        .uniform('uInterleaveX',    'int',   0)
        .uniform('uVisDomains',     'vec2',  $p.fieldDomains.map(d=>d.slice()))
        .uniform('uVisScale',       'vec2', [1.0, 1.0])
        .uniform('uPosOffset',      'vec2', [0.0, 0.0])
        .uniform('uFeatureCount',   'int',   0)
        .uniform('uMarkSize',       'float', 10.0)
        .uniform('uMarkSpace',      'vec2',  [0.02, 0.02])
        .uniform('uDefaultAlpha',   'float', 1.0)
        .uniform('uDefaultWidth',   'float', 1.0 / $p.viewport[0])
        .uniform('uDefaultHeight',  'float', 1.0 / $p.viewport[1])
        .uniform('uMaxRGBA',        'vec4',  [0, 0, 0, 0])
        .uniform('uDefaultColor',   'vec3',  [0.8, 0, 0])
        .uniform('uColorMode',      'int',   1)
        .varying('vColorRGBA',      'vec4'   );

    var enhance = reveal($p);

    $p.framebuffer('offScreenFBO', 'float', $p.viewport);
    $p.framebuffer('visStats', 'float', [1, 1]);

    // $p.framebuffer.enableRead('offScreenFBO');
    $p.renderMode = 'instancedXY';

    var renderer = render($p);

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
            viewIndex = options.viewIndex,
            viewTag = $p.views[viewIndex].id;

        var visDomain = {},
            visDimension = vmap.viewport || [$p.views[viewIndex].width, $p.views[viewIndex].height] || viewport;

        var width = visDimension[0],
            height =  visDimension[1],
            padding = $p.views[viewIndex].padding || chartPadding,
            offset = $p.views[viewIndex].offset || [0, 0];


        var dimSetting = encode($p, vmap, colorManager);

        if(!$p._update){
            $p.fields.forEach(function(f, i){
                visDomain[f] = $p.fieldDomains[i].slice();
                if(vmap.zero && (f == vmap.height || f == vmap.width ) && visDomain[f][0]>0) visDomain[f][0] = 0;
            });
        }

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

        // if(typeof data == 'string')
        //     $p.uniform.uDataInput = $p.framebuffer[data].texture;
        var viewSetting = {
            domain: visDomain,
            width: width,
            height: height,
            fields: $p.fields,
            vmap: vmap,
            onclick: interaction,
            categories: $p.categoryLookup,
            padding: padding,
            left: offset[0],
            top: viewport[1] - height - offset[1],
            colors: colorManager.getColors(),
            showLegend: $p.views[viewIndex].legend
        };

        viewSetting = Object.assign(viewSetting, dimSetting);

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
            offset[0] + padding.left,
            offset[1] + padding.bottom,
            width-padding.left-padding.right,
            height-padding.top-padding.bottom
        );
        gl.lineWidth(1.0);

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable( gl.BLEND );
        gl.blendEquation(gl.FUNC_ADD);

        if(mark == 'stack') {
            var result = $p.readResult('row');
            viewSetting.data = result.filter(d=>d[vmap.y]>0);
            viewSetting.fields = $p.fields;
            if($p.intervals.hasOwnProperty(vmap.x))
                viewSetting.isHistogram = true;
        }

        //TODO: Maybe just save the needed data domains instead of copying all
        if(!$p._update) {
            var pv = $p.views[viewIndex];
            pv.domains = Object.keys(visDomain).map(f=>visDomain[f]);
            $p.uniform.uVisDomains = pv.domains;
            if(pv.hasOwnProperty('chart') && typeof pv.chart.svg.remove == 'function') {
                pv.chart.svg.remove();
            }
            pv.chart = vis.addChart(viewSetting);
        } else {
            $p.uniform.uVisDomains = $p.views[viewIndex].domains;
            if(mark == 'stack'){
                var result = $p.readResult('row');
                $p.views[viewIndex].chart.update({
                    data: result
                })
            }
        }
        var primitive = gl.POINTS;
        if(['rect', 'bar'].indexOf(mark) !== -1) primitive = gl.TRIANGLES;
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

        if(mark!='stack') draw();
        if($p.revealDensity) enhance({
            viewIndex: viewIndex,
            dim: [width, height],
            offset: offset,
            padding: padding
        });
        $p.bindFramebuffer(null);

        if(!$p._update) {
            var actions = Object.keys(vmap)
                .filter(function(act){ return userActions.indexOf(act) !== -1});

            actions.forEach(function(action) {
                var viewId = vmap.id || $p.views[viewIndex].id,
                    response = {};
                response[viewId] = vmap[action];
                $p.interactions.push({
                    event: action,
                    condition: vmap[action].condition,
                    from: viewId,
                    response: response
                })
            })
        }
    }
    viz.chart = vis;
    return viz;
}
