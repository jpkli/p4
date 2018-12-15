import axis from './axis';
import format from './format';
import scale from './scale';
import legend from './legend';

export default function chart(frontSvg, backSvg, arg) {
    var options = arg || {},
        plot = frontSvg.append('g'),
        metavis = backSvg.append('g'),
        width = options.width,
        height = options.height,
        top = options.top || 0,
        left = options.left || 0,
        vmap = options.vmap || {},
        isHistogram = options.isHistogram || options.hist || false,
        features = options.fields || [],
        domain = options.domain,
        categories = options.categories,
        labels = plot.append('g'),
        onclick = options.onclick || null,
        onhover = options.onhover || null,
        showLegend = options.legend || true,
        tickOffset = options.axisOffset || [0, 0],
        padding = options.padding || {left: 0, right: 0, top: 0, bottom: 0},
        marks = [],
        frameBorder = options.frameBorder || false,
        gridlines = options.gridlines || {x: false, y: false},
        colors = options.colors;

    var scaleX = options.scaleX || 'linear',
        domainX = options.domainX || domain[vmap.x] || domain[vmap.width],
        scaleY = options.scaleY || 'linear',
        domainY = options.domainY || domain[vmap.y] || domain[vmap.height];

    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var xAxisOption = {
        container: metavis,
        dim: "x",
        width: width,
        height: height,
        domain: domainX,
        scale:  scaleX,
        align: "bottom",
        // ticks: 15,
        grid: gridlines.x,
        format: format(".3s"),
    };

    var yAxisOption = {
        container: metavis,
        dim: "y",
        domain: domainY,
        scale: scaleY,
        width: width,
        height: height,
        align: "left",
        // labelPos: {x: -5, y: -5},
        // ticks: 8,
        grid: gridlines.y,
        format: format(".3s"),
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

    if(scaleX == 'ordinal' || scaleX == 'categorical') {
        xAxisOption.ticks = domainX.length;
        while(width / xAxisOption.ticks < 20) {
            xAxisOption.ticks *= 0.5;
        }
        var maxStrLength = Math.max.apply(null, domainX.map(
            function(d){ return (typeof(d) == 'string') ? d.toString().length : 1; })
        );
        if(maxStrLength > 10) {
            xAxisOption.labelAngle = -30;
            xAxisOption.tickLabelAlign = 'end';
            xAxisOption.labelPos = {x: 0, y: -10};
        }
    }

    if(scaleY == 'ordinal' || scaleY == 'categorical') {
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
            x = axis(xAxisOption);
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
            y = axis(yAxisOption);
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

    // if(isHistogram) {
    //     xAxisOption.tickPosition = [-width / domainX.length /2, 0];
    //     xAxisOption.scale = "ordinal";
    //     xAxisOption.domain = domainX;
    //     xAxisOption.ticks = domainX.length;
    // }

    if((vmap.x || vmap.width) && !Array.isArray(vmap.x)) x = axis(xAxisOption);
    if((vmap.y || vmap.height) && !Array.isArray(vmap.y)) y = axis(yAxisOption);

    if((vmap.hasOwnProperty('x') || vmap.hasOwnProperty('width')) && !Array.isArray(vmap.x)) {
        var xAxisTitle = vmap.x || vmap.width;
        // xAxisTitle = xAxisTitle.replace(/_/g, ' ');
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
            .text(xAxisTitle);

    }
    if((vmap.hasOwnProperty('y') || vmap.hasOwnProperty('height')) && !Array.isArray(vmap.y)) {
        var yAxisTitle = vmap.y || vmap.height;
        // yAxisTitle = yAxisTitle.replace(/_/g, ' ');
        // yAxisOption.grid = 1;
        if(!Array.isArray(vmap.y)) {
            labels.append("g")
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -padding.left/1.25 )
                .attr("x", -height/2 )
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

    var chartLayer = {};

    chartLayer.updateAxisX =  function(newDomain) {
        x.remove();
        xAxisOption.domain = newDomain;
        x = axis(xAxisOption)
        return chartLayer;
    }
    chartLayer.updateAxisY =  function(newDomain) {
        y.remove();
        yAxisOption.domain = newDomain;
        y = axis(yAxisOption)
        return chartLayer;
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

    chartLayer.removeLegend = function() {
        colorLegend.remove()
    }

    chartLayer.svg = plot;
    chartLayer.x = Array.isArray(vmap.x) ? xAxes : x;
    chartLayer.y = Array.isArray(vmap.y) ? yAxes : y;

    return chartLayer;
};
