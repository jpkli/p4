
import Brush from './vis/brush';
export default function interact($p, options) {
    var viewTags = options.view || [$p.views[0].id];

    if(!Array.isArray(viewTags)) viewTags = [viewTags];

    var actions = options.actions || options.events || [],
        condition = options.condition || {},
        facet = options.facet || false,
        callback = options.callback || function() {};

    if($p._update) return;

    if(!condition.x && !condition.y) {
        condition.x = condition.y = true;
    }

    viewTags.forEach(function(viewTag){
        var vis = $p.views.filter(v=>v.id == viewTag)[0];
        if(!Array.isArray(actions)) {
            actions = [actions];
        }

        if(vis === undefined || !vis.hasOwnProperty('chart')) return;

        var vmap = vis.vmap,
            p = vis.padding || $p.padding,
            w = vis.width - p.left - p.right,
            h = vis.height - p.top - p.bottom;
        
        var interactor = vis.chart.svg.append("g")
            .attr("class", "selector")

        if(facet === 'rows') {
            h = $p.viewport[1] - p.bottom;
        } else if(facet === 'columns') {
            w = $p.viewport[0] - p.right;
        }

        var rect = interactor.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "none");

        var svg = interactor.svg,
            box = rect.svg.getBoundingClientRect();

        function getSelection(e) {
            var dx = e.clientX - box.left;
            var dy = e.clientY - box.top;
            var selection = {};
            if(vmap.x) {
                selection[vmap.x] = [vis.chart.x.invert(dx)];
            }
            if(vmap.y) {
                selection[vmap.y] = [vis.chart.y.invert(h - dy)];
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
                    let updateEvent = (condition.lazy) ? 'brushend' : 'brush';
                    brushOptions[updateEvent] = function(d) {
                        var selection = {};
                        if(vmap.x && d.x) selection[vmap.x] = d.x;
                        if(vmap.y && d.y) {
                            if (d.y[0] > d.y[1]) {
                                selection[vmap.y] = d.y.reverse();
                            } else {
                                selection[vmap.y] = d.y;
                            }
                        }

                        Object.keys(selection).forEach(k => {
                            if ($p.uniqueValues.hasOwnProperty(k)) {
                                let values = $p.uniqueValues[k]
                                let start = Math.floor(selection[k][0]);
                                let end = Math.floor(selection[k][1]);
                                if(end === start) start -= 1;
                                selection[k] = [values[start], values[end]];
                            } 
                        })

                        callback(selection);
                    }
                    if(condition.x && typeof(vis.chart.x.invert) == 'function')
                        brushOptions.x = vis.chart.x.invert;

                    if(condition.y && typeof(vis.chart.y.invert) == 'function') {
                        brushOptions.y = (y) => { 
                            if(vmap.mark === 'rect') {
                                return vis.chart.y.invert(h-y);
                            }
                            return vis.chart.y.invert(y);
                        } 
                    }
                    
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
                vis.updateDomain = true;
                let delta = {x: null, y: null};
                let scale = 0.05;
                svg.onmousewheel = function(e) {
                    let dir = (e.deltaY > 0) ? 1 : -1;
                    let selection = {};
                    let proportion = {
                        x: (e.clientX - box.left) / box.width,
                        y: 1.0 - (e.clientY - box.top) / box.height
                    }

                    for (let dim of ['x', 'y']) {
                        if(condition[dim]) {
                            let attr = vis.vmap[dim];
                            if(delta[dim] === null ){
                                delta[dim] =  scale * (vis.domains[attr][1] - vis.domains[attr][0]);
                            }
      
                            let domain = vis.domains[attr];
                            let newDomain = [domain[0] - dir * delta[dim] * (proportion[dim]), domain[1] + dir * delta[dim] * (1-proportion[dim])];
                            if(newDomain[1] - newDomain[0] > 1e-9){
                                selection[attr] = newDomain;
                                vis.domains[attr] = newDomain;
                            } else {
                                scale *= 0.5;
                            }

                        }
                    }
                    callback(selection);
                }

            } else if(action == 'pan') {
                svg.style.cursor = 'move';
                vis.updateDomain = true;
                let selection = {};
                svg.onmousedown = function(e) {
                    let sx = e.clientX;
                    let sy = e.clientY;
                    svg.style.cursor = 'move';

                    function onpan(e) {
                        let delta = {
                            x: -(e.clientX - sx) / box.width,
                            y: (e.clientY - sy) / box.height
                        }
                        for (let dim of ['x', 'y']) {
                            if(condition[dim]) {
                                let attr = vis.vmap[dim];
                                let domain = vis.domains[attr];
                                let diff = delta[dim] * (domain[1] - domain[0]);
                                let newDomain = [domain[0] + diff, domain[1] + diff];
                                selection[attr] = newDomain;
                                vis.domains[attr] = newDomain;
                            }
                        }
                        sx = e.clientX;
                        sy = e.clientY;
                        callback(selection);
                    }

                    window.addEventListener("mousemove", onpan, false);
                    window.addEventListener("mouseup", function(){
                        svg.style.cursor = 'default';
                        window.removeEventListener("mousemove", onpan, false);
                    }, false);

                }

            } else if(action == 'click') {
                svg.onclick = function(e) {
                    callback(getSelection(e));
                }
            } 
            
            if(action == 'hover') {
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
