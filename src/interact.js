
import Brush from './metavis/brush';
export default function interact($p, options) {
    var viewTags = options.view || [$p.views[0].id];

    if(!Array.isArray(viewTags)) viewTags = [viewTags];

    var actions = options.actions || options.events || [],
        condition = options.condition || {},
        callback = options.callback || function() {};

    if($p._update) return;

    viewTags.forEach(function(viewTag){
        var vis = $p.views.filter(v=>v.id == viewTag)[0];
        console.log(vis)
        if(!Array.isArray(actions)) {
            actions = [actions];
        }
        var vmap = vis.vmap,
            p = vis.padding || $p.padding,
            w = vis.width - p.left - p.right,
            h = vis.height - p.top - p.bottom;

        var interactor = vis.chart.svg.append("g")
                .attr("class", "selector")

        var rect = interactor.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "none");

        var svg = interactor.svg,
            box = rect.svg.getBoundingClientRect();

        var sx, sy,
            tx = 0, ty = 0,
            dy = 1;

        function updatePos(e) {
            tx += (e.clientX - sx) / dy;
            ty += (e.clientY - sy) / dy;
            sx = e.clientX;
            sy = e.clientY;
            $p.uniform.uPosOffset.data = [tx / w, ty / h];
        }

        function getSelection(e) {
            var dx = e.clientX - box.left;
            var dy = e.clientY - box.top;
            var selection = {};
            if(vmap.x) {
                selection[vmap.x] = [vis.chart.x.invert(dx)];
            }
            if(vmap.y) {
                selection[vmap.y] = [vis.chart.y.invert(dy)];
            }
            return selection;
        }

        actions.forEach(function(action){
            if(action == 'brush') {
                svg.style.cursor = "crosshair";
                var brushOptions = {
                    container: interactor,
                    width: w,
                    height: h
                };

                if(!Array.isArray(vmap.x) && !Array.isArray(vmap.y)) {
                    if(!condition.x && !condition.y) {
                        condition.x = condition.y = true;
                    }
                    brushOptions.brush = function(d) {
                        var selection = {};
                        if(vmap.x && d.x) selection[vmap.x] = d.x;
                        if(vmap.y && d.y) selection[vmap.y] = d.y.reverse();
                        callback(selection);
                    }
                    if(condition.x && typeof(vis.chart.x.invert) == 'function')
                        brushOptions.x = vis.chart.x.invert;

                    if(condition.y && typeof(vis.chart.y.invert) == 'function')
                        brushOptions.y = vis.chart.y.invert

                    new Brush(brushOptions);
                }

                var dims = ['x', 'y'],
                    selections = {};

                dims.forEach(function(dim){
                    if(Array.isArray(vmap[dim]) && Array.isArray(vis.chart[dim])){
                        var axisDist = (dim == 'x') ? h : w,
                            selectors = vis.chart.svg.append('g');

                        axisDist =  axisDist / (vmap[dim].length-1);

                        vmap[dim].forEach(function(d, i) {

                            var axisSelect = selectors.append("g");
                            if(dim == 'x') {
                                brushOptions.height = axisDist * 0.2;
                                axisSelect.translate(0, axisDist * (i - 0.1));
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim];
                                    callback(selections);
                                }
                            } else {
                                brushOptions.width = axisDist * 0.2;
                                axisSelect.translate(axisDist * (i - 0.1), 0);
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim].reverse();
                                    callback(selections);
                                }
                            }
                            brushOptions.container = axisSelect;
                            brushOptions[dim] = vis.chart[dim][i].invert;

                            new Brush(brushOptions);
                        });
                    }
                })
            } else if(action == 'zoom') {
                svg.onmousewheel = function(e) {
                    sx = e.clientX - box.left;
                    sy = e.clientY - box.top;
                    var ny =  dy * Math.exp(e.deltaY / 1000);
                    var delta = ny - dy;
                    dy = ny;
                    $p.uniform.uPosOffset.data = [-sx * delta / w, -sy * delta / h];
                    $p.uniform.uVisScale.data = [dy, dy];

                    callback();
                }

            } else if(action == 'pan') {
                svg.style.cursor = 'move';
                svg.onmousedown = function(e) {
                    sx = e.clientX;
                    sy = e.clientY;
                    svg.style.cursor = 'move';

                    svg.onmousemove = function(e) {
                        tx += (e.clientX - sx) / dy;
                        ty += (e.clientY - sy);

                        callback();
                    }

                    svg.onmouseup = function(e) {
                        updatePos(e);
                        svg.style.cursor = 'default';
                        svg.onmousemove = null;
                        svg.onmouseup = null;
                    }
                }

            } else if(action == 'click') {
                svg.onclick = function(e) {
                    callback(getSelection(e));
                }
            } else if(action == 'hover') {
                svg.onmouseover = function(e) {
                    callback(getSelection(e));
                    svg.onmousemove = function(e) {
                        callback(getSelection(e));
                    }

                    // svg.onmouseout = function(e) {
                    //     updatePos(e);
                    //     svg.style.cursor = 'default';
                    //     svg.onmousemove = null;
                    //     svg.onmouseover = null;
                    // }
                }
            }
        })
    })
}
