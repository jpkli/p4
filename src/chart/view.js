define(function(require){
    "use strict";
    var WebVis = require('./base'),
        Axis = require('./axis'),
        format = require('./format'),
        scale = require('./scale');

    return WebVis.extend(function Chart(option){
        var chart = this,
            canvas = option.canvas,
            svg = this.$svg(),
            vmap = option.vmap,
            color = option.color || "steelblue",
            chartPadding = this.$padding || {left: 0, right: 0, top: 0, bottom: 0},
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
                tickOffset = options.axisOffset || [0, 0],
                padding = options.padding || chartPadding,
                marks = [];

            var scaleX = options.scaleX || 'linear',
                domainX = options.domainX || domain[vmap.x] || domain[vmap.width],
                scaleY = options.scaleY || 'linear',
                domainY = options.domainY || domain[vmap.y] || domain[vmap.height];

            width -= padding.left + padding.right;
            height -= padding.top + padding.bottom;

            var xAxisOption = {
                container: plot,
                dim: "x",
                width: width,
                height: height,
                domain: domainX,
                scale:  scaleX,
                align: "bottom",
                // ticks: 5,
                // grid: 1,
                format: format(".3s"),
            };

            var yAxisOption = {
                container: plot,
                dim: "y",
                domain: domainY,
                scale: scaleY,
                width: width,
                height: height,
                align: "left",
                // labelPos: {x: -5, y: -5},
                // grid: 1,
                format: format(".3s"),
            };

            if(scaleX == 'ordinal') {
                xAxisOption.ticks = domainX.length;
                while(width / xAxisOption.ticks < 20) {
                    xAxisOption.ticks *= 0.5;
                }
                var maxStrLength = Math.max.apply(null, domainX.map(
                    function(d){ return (typeof(d) == 'string') ? d.toString().length : 1; })
                );
                if(maxStrLength > 10) {
                    xAxisOption.labelAngle = -15;
                    xAxisOption.labelPos = {x: 0, y: -22};
                }
            }

            if(scaleY == 'ordinal') {
                yAxisOption.ticks = domainY.length;
                while(width / yAxisOption.ticks < 20) {
                    yAxisOption.ticks *= 0.5;
                }
            }

            var x, y, xAxes = [], yAxes = [];

            // For parallel coordinates

            if(Array.isArray(vmap.x)) {
                var axisDist = height / (vmap.x.length-1);

                vmap.x.forEach(function(d, i) {
                    xAxisOption.position = i * axisDist + 1;
                    xAxisOption.domain = domain[d];
                    if(categories.hasOwnProperty(d)){
                        xAxisOption.scale = 'ordinal';
                        xAxisOption.tickAlign = 'outer';
                        xAxisOption.domain = categories[d].reverse();
                    }
                    var labelOffset = 20;
                    if(i === 0) {
                        xAxisOption.tickPosition = [0, -5];
                        xAxisOption.labelPos = {x: 0, y: 2};
                        labelOffset = 35;
                    } else {
                        xAxisOption.tickPosition = null;
                        xAxisOption.labelPos = null;
                    }
                    x = Axis(xAxisOption);
                    xAxes[i] = x;

                    labels
                    .append("text")
                      .attr("x", 5 )
                      .attr("y", i * axisDist - labelOffset)
                      .attr("dy", "1em")
                      .css("text-anchor", "middle")
                      .css("font-size", "1em")
                      .text(d);
                });
            }

            if(Array.isArray(vmap.y)) {
                var axisDist = width / (vmap.y.length-1);

                vmap.y.forEach(function(d, i) {
                    yAxisOption.position = i * axisDist;
                    yAxisOption.domain = domain[d];
                    if(categories.hasOwnProperty(d)){
                        yAxisOption.scale = 'ordinal';
                        yAxisOption.tickAlign = 'outer';
                        yAxisOption.domain = categories[d].reverse();
                    }

                    if(i == vmap.y.length-1) {
                        yAxisOption.tickPosition = [5, 0];
                        yAxisOption.tickLabelAlign = "start";
                        yAxisOption.labelPos = {x: 8, y: -5};

                    }
                    y = Axis(yAxisOption);
                    yAxes[i] = y;

                    labels
                    .append("text")
                      .attr("y", -padding.top + 10)
                      .attr("x", i * axisDist)
                      .attr("dy", "1em")
                      .css("text-anchor", "middle")
                      .css("font-size", "1em")
                      .text(d);
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
                if(maxStrLength > 10) {
                    xAxisOption.labelAngle = -15;
                    xAxisOption.tickLabelAlign = 'middle';
                    xAxisOption.labelPos = {x: 0, y: -22};
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
                    var hcolor = hcolor || "darkorange";
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
                            x: x(d[vmap.x]) - barWidth * 0.45,
                            y: 0,
                            width: barWidth * 0.90,
                            height: 0,
                            fill: "darkorange"
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

                if((vmap.x || vmap.width) && !Array.isArray(vmap.x)) x = Axis(xAxisOption);
                if((vmap.y || vmap.height) && !Array.isArray(vmap.y)) y = Axis(yAxisOption);
            }
            if(vmap.hasOwnProperty('x') && !Array.isArray(vmap.x)) {
                // xAxisOption.grid = 1;
                labels.append("g")
                  .append("text")
                    .attr("x", width/2)
                    .attr("y", height + padding.bottom/2 )
                    .attr("dy", "1em")
                    .css("text-anchor", "middle")
                    .css("font-size", "1.0em")
                    .css("font-weight", "bold")
                    .css(" text-transform", "capitalize")
                    .text(vmap.x.replace(/_/g, ' '));


            }
            if(vmap.hasOwnProperty('y') && !Array.isArray(vmap.y)) {
                // yAxisOption.grid = 1;
                if(!Array.isArray(vmap.y)) {
                    labels.append("g")
                      .append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", -padding.left )
                        .attr("x", -height/2 )
                        .attr("dy", "1em")
                        .css("text-anchor", "middle")
                        .css("font-size", "1.0em")
                        .css("font-weight", "bold")
                        .css(" text-transform", "capitalize")
                        .text(vmap.y.replace(/_/g, ' '));
                    }

            }
            // plot.append("line")
            //     .attr('x1', 0)
            //     .attr('x2', width)
            //     .attr('y1', 0)
            //     .attr('y2', 0)
            //     .css('stroke', '#000')
            // plot.append("line")
            //     .attr('x1', width)
            //     .attr('x2', width)
            //     .attr('y1', 0)
            //     .attr('y2', height)
            //     .css('stroke', '#000')
                // .css('stroke-opacity', 0.5)

            plot.translate(padding.left+left, padding.top+top);

            var chartLayer = {};

            chartLayer.update =  function(spec) {
                var data = spec.data || [];

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
                if(yAxes.length) {
                    yAxes.forEach(function(yp) {
                        yp.remove();
                    })
                }
            }

            chartLayer.svg = plot;
            chartLayer.x = Array.isArray(vmap.x) ? xAxes : x;
            chartLayer.y = Array.isArray(vmap.y) ? yAxes : y;

            return chartLayer;
        };

        this.canvas.push(canvas);
        this.svg.push(svg);
        this.viz();

        return chart;

    });

});
