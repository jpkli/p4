if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var Viz = require('./base'),
        Axis = require('./axis'),
        Selector = require('./selector'),
        format = require('./format'),
        scale = require('./scale');

    return Viz.extend(function Chart(option){
        var chart = this,
            canvas = option.canvas,
            svg = this.$svg(),
            vmap = option.vmap,
            color = option.color || "steelblue",
            padding = this.$padding || {left: 0, right: 0, top: 0, bottom: 0},
            domain = option.domain || {x: [0, 1000], y: [0, 1]},
            scales = option.scales || {x: 'linear', y: 'linear'};

        chart.addLayer = function(options) {
            var plot = svg.append('g'),
                width = options.width,
                height = options.height,
                top = options.top || 0,
                left = options.left || 0,
                data = options.data || [],
                vmap = options.vmap || {},
                isHistogram = options.isHistogram || options.hist || false,
                features = options.fields || [],
                domain = options.domain,
                categories = options.categories,
                selector,
                labels = plot.append('g'),
                onclick = options.onclick || null,
                onhover = options.onhover || null,
                marks = [];

            width -= padding.left + padding.right;
            height -= padding.top + padding.bottom;
            var brush = {
                brushstart: function(){},
                brush: function(){},
                brushend: function() {}
            };

            var xAxisOption = {
                container: plot,
                dim: "x",
                width: width,
                height: height,
                domain: domain[vmap.x],
                scale:  "linear",
                align: "bottom",
                labelPos: {x: 0, y: -20},
                ticks: 5,
                // grid: 1,
                format: format(".3s"),
            };

            var yAxisOption = {
                container: plot,
                dim: "y",
                domain: domain[vmap.y],
                width: width,
                height: height,
                align: "left",
                ticks: 5,
                labelPos: {x: -5, y: -5},
                // grid: 1,
                format: format(".3s"),
            };

            var brushOptions = {
                width: width,
                height: height,
                padding: padding,
                brushstart: null,
                brush: null,
                brushend: null,
            };

            var x, y, ypAxes = [];

            // For parallel coordinates

            if(Array.isArray(vmap.x)) {
                var axisDist = width / (vmap.x.length-1),
                    selectors = plot.append('g');

                vmap.x.forEach(function(d, i) {
                    brushOptions.container = selectors;
                    new Selector(brushOptions);
                    xAxisOption.position = i * axisDist;
                    xAxisOption.domain = domain[d];
                    x = Axis(xAxisOption);
                });
            }

            if(Array.isArray(vmap.y)) {
                var axisDist = width / (vmap.y.length-1),
                    selectors = plot.append('g');

                vmap.y.forEach(function(d, i) {
                    var axisSelect = selectors.append("g")
                        .translate(axisDist * (i - 0.1), 0);

                    brushOptions.brush = function(range) {
                        var spec = {};
                        spec[d] = range.y.reverse();
                        onclick(spec);
                    }

                    yAxisOption.position = i * axisDist;
                    yAxisOption.domain = domain[d];
                    if(categories.hasOwnProperty(d)){
                        yAxisOption.scale = 'ordinal';
                        yAxisOption.tickAlign = 'outer';
                        yAxisOption.domain = categories[d].reverse();
                    }

                    y = Axis(yAxisOption);
                    ypAxes[i] = y;

                    brushOptions.container = axisSelect;
                    brushOptions.y = y.invert;
                    brushOptions.width = axisDist * 0.2,
                    new Selector(brushOptions);

                    labels
                    .append("text")
                      .attr("y", -padding.top)
                      .attr("x", i * axisDist)
                      .attr("dy", "1em")
                      .css("text-anchor", "middle")
                      .css("font-size", "1em")
                      .text(d.replace(/_/g, ' '));
                });
            }

            var colorTable = options.colorTable,
                colorSchemes = options.colorScheme,
                cf = features.indexOf(vmap.color);

            var color = function() { return vmap.color || 'steelblue' };
            if(cf !== -1) {
                var colorScale = scale({
                    domain: domain[map.color],
                    range: [0, colorSchemes.length-1]
                });
                color = function(c) {
                    return colorSchemes[Math.floor(colorScale(c))];
                }
            }

            var selected = [],
                selectedData = [],
                hMarks = [],
                barWidth;

            if(data.length) {
                // x.remove();
                console.log(data);
                barWidth = width / data.length;
                xAxisOption.domain = data.map(function(d) { return d[vmap.x];});
                if(isHistogram)
                    xAxisOption.tickPosition = [barWidth/2, 0];
                var maxStrLength = Math.max.apply(null, xAxisOption.domain.map(
                    function(d){ return (typeof(d) == 'string') ? d.toString().length : 1; })
                );
                if(maxStrLength > 10 || barWidth < 40) {
                    xAxisOption.labelAngel = -40;
                    xAxisOption.labelPos = {x: 15, y: -10};
                }
                xAxisOption.scale = "ordinal";
                xAxisOption.ticks = (xAxisOption.domain.length < 16)
                    ? xAxisOption.domain.length : 16;
                // xAxisOption.width = width+padding.left+padding.right;
                x = Axis(xAxisOption);

                yAxisOption.domain[0] = 0;
                // yAxisOption.scale = 'power';
                // yAxisOption.exponent = 0.5;
                y = Axis(yAxisOption);

                plot.highlight = function(selected, hcolor) {
                    var hcolor = hcolor || "orange";
                    marks.forEach(function(c, i){
                        c.attr("fill", color());
                    });
                    selected.forEach(function(si){
                        marks[si].attr("fill", hcolor);
                    });
                }


                data.forEach(function(d, i){
                    var barHeight = isFinite(y(d[vmap.y])) ? y(d[vmap.y]) : height;

                    var bar = plot.append("rect")
                        .Attr({
                            x: x(d[vmap.x]) - barWidth*0.48,
                            y: barHeight,
                            width: barWidth * 0.96,
                            height: height - barHeight ,
                            fill: color(d[vmap.color]),
                            // stroke: color(d[vmap.color])
                        });
                    marks.push(bar);

                    var hBar = plot.append("rect")
                        .Attr({
                            x: x(d[vmap.x]) - barWidth * 0.4,
                            y: 0,
                            width: barWidth * 0.8,
                            height: 0,
                            fill: "orange"
                        });
                    hMarks.push(hBar);

                    function onSelect(evt) {
                        if(evt.shiftKey) {
                            selected.push(i);
                            selectedData.push(data[i]);
                        } else {
                            selected = [i];
                            selectedData = [data[i]];
                        }
                        plot.highlight(selected);
                        // bar.svg.attr("fill", "#A00");
                        var filter = {};
                        // console.log(selectedData[0][vmap.x]);
                        filter[vmap.x] = [selectedData[0][vmap.x]];
                        if(onclick !== null) onclick(filter);
                        // if(onhover !== null) onhover(selectedData);
                    }

                    if(onclick !== null) bar.svg.onclick = onSelect;
                    if(onhover !== null) {
                        bar.svg.onmouseenter = function() {
                            hMarks.forEach(function(h, i){
                                h.Attr({ y: 0, height: 0 });
                            })
                        }
                        bar.svg.onmouseover = onSelect;
                        bar.svg.onmouseout = function(evt) {
                            selected = [];
                            selectedData = [];
                            plot.highlight(selected, color);
                        }
                    }
                });
            } else {
                if(vmap.hasOwnProperty('x')) x = Axis(xAxisOption);
                if(vmap.hasOwnProperty('y')) y = Axis(yAxisOption);
            }
            if(vmap.hasOwnProperty('x') && !Array.isArray(vmap.y)) {
                // xAxisOption.grid = 1;

                brushOptions.x = x.invert;

                labels.append("g")
                  .append("text")
                    .attr("x", width/2)
                    .attr("y", height + padding.bottom/2 )
                    .attr("dy", "1em")
                    .css("text-anchor", "middle")
                    .css("font-size", "1.2em")
                    .css(" text-transform", "capitalize")
                    .text(vmap.x.replace(/_/g, ' '));
            }
            if(vmap.hasOwnProperty('y') && !Array.isArray(vmap.x)) {
                // yAxisOption.grid = 1;

                brushOptions.y = y.invert;

                if(!Array.isArray(vmap.y)) {
                    labels.append("g")
                      .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", -padding.left )
                        .attr("x", -height/2 )
                        .attr("dy", "1em")
                        .css("text-anchor", "middle")
                        .css("font-size", "1.2em")
                        .css(" text-transform", "capitalize")
                        .text(vmap.y.replace(/_/g, ' '));
                }
            }
            if(!data.length && brushOptions.hasOwnProperty('x') && brushOptions.hasOwnProperty('y')) {
                brushOptions.container = plot;
                brushOptions.brush = function(d) {
                    var spec = {};
                    spec[vmap.x] = d.x;
                    spec[vmap.y] = d.y.reverse();
                    // console.log(spec);
                    onclick(spec);
                }
                selector = new Selector(brushOptions);
            }

            plot.translate(padding.left+left, padding.top+top);

            var chartLayer = {};

            chartLayer.update =  function(spec) {
                var domain = spec.domain || {},
                    data = spec.data || [];

                if(domain.hasOwnProperty('x')) {
                    x.svg.remove();
                    xAxisOption.domain = domain.x;
                    x = Axis(xAxisOption);
                    selector.x(x.invert);
                }
                if(domain.hasOwnProperty('y')) {
                    y.svg.remove();
                    yAxisOption.domain = domain.y;
                    y = Axis(yAxisOption);
                    selector.y(y.invert);
                }
                // console.log(vmap.x);
                if(data.length) {
                    data.forEach(function(d, i){
                        var barHeight = isFinite(y(d[vmap.y])) ? y(d[vmap.y]) : height;
                        if(hMarks[i]) {
                            hMarks[i].Attr({
                                y: barHeight,
                                height: height - barHeight,
                                fill: "orange"
                            });
                        }
                    })
                } else {
                    hMarks.forEach(function(h, i){
                        h.Attr({ y: 0, height: 0 });
                    })
                }
            }

            chartLayer.removeAxis = function() {
                x.remove();
                y.remove();
                if(ypAxes.length) {
                    ypAxes.forEach(function(yp) {
                        yp.remove();
                    })
                }
            }

            chartLayer.svg = plot;

            return chartLayer;
        };

        this.canvas.push(canvas);
        this.svg.push(svg);
        this.viz();

        return chart;

    });

});
