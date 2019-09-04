import axis from './axis';
import format from './format';
import legend from './legend';

export default function chart(frontSvg, backSvg, arg) {
    var options = arg || {},
        plot = frontSvg.append('g'),
        metavis = backSvg.append('g'),
        frontMetaVis = frontSvg.append('g'),
        width = options.width,
        height = options.height,
        top = options.top || 0,
        left = options.left || 0,
        vmap = options.vmap || {},
        histogram =  options.histogram,
        features = options.fields || [],
        domain = options.domain,
        strLists = options.strLists,
        labels = plot.append('g'),
        onclick = options.onclick || null,
        onhover = options.onhover || null,
        showLegend = options.legend,
        tickOffset = options.axisOffset || [0, 0],
        padding = options.padding || {left: 0, right: 0, top: 0, bottom: 0},
        marks = [],
        frameBorder = options.frameBorder || false,
        gridlines = options.gridlines || {x: false, y: false},
        colors = options.colors;

    var scale = options.scale || {x: 'linear', y: 'linear'},
        domainX = options.domainX || domain[vmap.x] || domain[vmap.width],
        domainY = options.domainY || domain[vmap.y] || domain[vmap.height];

    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var axisOption = {
        x: {
            container: metavis,
            dim: "x",
            width: width,
            height: height,
            domain: domainX,
            scale:  scale.x,
            align: "bottom",
            // ticks: 15,
            grid: gridlines.x,
            format: format(".3s"),
        },
        y: {
            container: metavis,
            dim: "y",
            domain: domainY,
            scale: scale.y,
            width: width,
            height: height,
            align: "left",
            // labelPos: {x: -5, y: -5},
            // ticks: 8,
            grid: gridlines.y,
            format: format(".3s"),
        }
    };

    let colorLegend;
    if(showLegend && features.indexOf(vmap.color) !== -1){
        colorLegend = legend({
            container: metavis,
            width: 20,
            height: 180,
            dim: "y",
            domain: domain[vmap.color],
            pos: [width + padding.right/2, 0],
            colors: colors
        });
    }

    let x, y, xAxes = [], yAxes = [];

    // For parallel coordinates
    if(Array.isArray(vmap.x)) {
        let axisDist = height / (vmap.x.length-1);
        axisOption.x.container = frontMetaVis;
        vmap.x.forEach(function(d, i) {
            axisOption.x.position = i * axisDist + 1;
            axisOption.x.domain = domain[d];
            if(strLists.hasOwnProperty(d)){
                axisOption.x.scale = 'ordinal';
                axisOption.x.tickAlign = 'outer';
                axisOption.x.domain = strLists[d].reverse();
            }
            let labelOffset = 20;
            if(i === 0) {
                axisOption.x.tickPosition = [0, -5];
                axisOption.x.labelPos = {x: 0, y: 2};
                labelOffset = 35;
            } else {
                axisOption.x.tickPosition = null;
                axisOption.x.labelPos = null;
            }
            x = axis(axisOption.x);
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
        axisOption.y.container = frontMetaVis;
        vmap.y.forEach(function(d, i) {
            axisOption.y.position = i * axisDist;
            axisOption.y.domain = domain[d];
            if(strLists.hasOwnProperty(d)){
                axisOption.y.scale = 'ordinal';
                axisOption.y.tickAlign = 'outer';
                axisOption.y.domain = strLists[d].reverse();
            }
            if(i == vmap.y.length-1) {
                axisOption.y.tickPosition = [5, 0];
                axisOption.y.tickLabelAlign = "start";
                axisOption.y.labelPos = {x: 8, y: -5};

            }
            y = axis(axisOption.y);
            yAxes[i] = y;

            labels.append("text")
              .attr("y", -padding.top + 10)
              .attr("x", i * axisDist)
              .attr("dy", "1em")
              .css("text-anchor", "middle")
              .css("font-size", "1em")
              .text(d);
        });
    }

    let histDomain = {
        x: domainX, 
        y: domainY
    };
    for(let dim of ['x', 'y']) {
        if(scale[dim] == 'ordinal' || scale[dim] == 'categorical') {
            if(width / histDomain[dim].length < 10) {
                axisOption[dim].ticks = histDomain[dim].length;
            }
            // while(width / axisOption[dim].ticks < 20) {
            //     axisOption[dim].ticks *= 0.5;
            // }
        }

        if(histogram[dim]) {
            axisOption[dim].tickPosition = (dim == 'x') 
                ? [-width / (histDomain[dim].length-1) /2, 0]
                : [0, height/ (histDomain[dim].length-1) /2]

            axisOption[dim].scale = "ordinal";
            axisOption[dim].tickAlign = "outer";
            axisOption[dim].domain = histDomain[dim];
            axisOption[dim].ticks = histDomain[dim].length;
        }
    }

    if((vmap.x || vmap.width) && !Array.isArray(vmap.x)) x = axis(axisOption.x);
    if((vmap.y || vmap.height) && !Array.isArray(vmap.y)) y = axis(axisOption.y);

    if((vmap.hasOwnProperty('x') || vmap.hasOwnProperty('width')) && !Array.isArray(vmap.x)) {
        let xAxisTitle = vmap.x || vmap.width;
        labels.append("g")
          .append("text")
            .attr("x", width/2)
            .attr("y", height + padding.bottom/2 )
            .attr("dy", "1em")
            .css("text-anchor", "middle")
            .css("font-size", "1.0em")
            .css("font-weight", "bold")
            .css(" text-transform", "capitalize")
            .text(xAxisTitle);

    }
    if((vmap.hasOwnProperty('y') || vmap.hasOwnProperty('height')) && !Array.isArray(vmap.y)) {
        let yAxisTitle = vmap.y || vmap.height;
        if(!Array.isArray(vmap.y)) {
            labels.append("g")
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -padding.left / 1.25)
                .attr("x", -height / 2)
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .css("font-size", "1.0em")
                .css("font-weight", "bold")
                .css(" text-transform", "capitalize")
                .text(yAxisTitle);
        }
    }
    
    if(frameBorder) {
        plot.append("line")
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', 0)
            .attr('y2', 0)
            .css('stroke', '#000')
        plot.append("line")
            .attr('x1', width)
            .attr('x2', width)
            .attr('y1', 0)
            .attr('y2', height)
            .css('stroke', '#000')
            .css('stroke-opacity', 0.5)
    }

    plot.translate(padding.left+left, padding.top+top);
    metavis.translate(padding.left+left, padding.top+top);
    frontMetaVis.translate(padding.left+left, padding.top+top);

    let chartLayer = {};
    chartLayer.updateAxisX =  function(newDomain) {
        x.remove();
        axisOption.x.domain = newDomain;
        x = axis(axisOption.x)
        return chartLayer;
    }
    chartLayer.updateAxisY =  function(newDomain) {
        y.remove();
        axisOption.y.domain = newDomain;
        y = axis(axisOption.y)
        return chartLayer;
    }
    chartLayer.removeAxis = function() {

        if(yAxes.length) {
            yAxes.forEach(function(yp) {
                yp.remove();
            })
        } else if(xAxes.length) {
            xAxes.forEach(function(xp) {
                xp.remove();
            })
        } else {
            x.remove();
            y.remove();
        }

        labels.remove();
    }

    chartLayer.axisLabels = labels;

    chartLayer.removeLegend = function() {
        if(showLegend) {
            colorLegend.remove();
        }
    }
    chartLayer.svg = plot;
    chartLayer.x = Array.isArray(vmap.x) ? xAxes : x;
    chartLayer.y = Array.isArray(vmap.y) ? yAxes : y;

    return chartLayer;
};
