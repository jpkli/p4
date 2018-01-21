define(function(require){
    const Brush = require('./chart/brush');
    return function($p, options) {
        var vis = options.vis || options.chart,
            actions = options.actions || options.events || [],
            callback = options.callback || function() {};

        var vmap = vis.vmap,
            p = options.padding || $p.padding,
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

        actions.forEach(function(action){
            if(action == 'brush') {
                svg.style.cursor = "crosshair";
                var brushOptions = {
                    container: interactor,
                    width: w,
                    height: h
                };
                if(!Array.isArray(vmap.x) && !Array.isArray(vmap.y)) {
                    brushOptions.brush = function(d) {
                        var spec = {};
                        if(vmap.x) spec[vmap.x] = d.x;
                        if(vmap.y) spec[vmap.y] = d.y.reverse();
                        callback(spec);
                    }
                    brushOptions.x = vis.chart.x.invert;
                    brushOptions.y = vis.chart.y.invert
                    new Brush(brushOptions);
                }

                var dims = ['x', 'y'];

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
                                    var spec = {};
                                    spec[d] = range[dim];
                                    callback(spec);
                                }
                            } else {
                                brushOptions.width = axisDist * 0.2;
                                axisSelect.translate(axisDist * (i - 0.1), 0);
                                brushOptions.brush = function(range) {
                                    var spec = {};
                                    spec[d] = range[dim].reverse();
                                    callback(spec);
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
                        updatePos(e)
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
                    sx = e.clientX - box.left;
                    sy = e.clientY - box.top;
                    console.log('clicked', sx, sy);
                }
            } else if(action == 'hover') {
                svg.onmouseover = function(e) {
                    sx = e.clientX;
                    sy = e.clientY;
                    console.log('hover', sx, sy);
                    svg.onmousemove = function(e) {
                        sx = e.clientX;
                        sy = e.clientY;

                        console.log('hover', sx, sy);
                    }

                    svg.onmouseout = function(e) {
                        updatePos(e);
                        svg.style.cursor = 'default';
                        svg.onmousemove = null;
                        svg.onmouseover = null;
                    }
                }
            }
        })
    }
})
