define(function(require){
    return function (options) {
        var data = options.data || [],
            dopt = options.dopt || 'aggregate',
            container = options.container || 'body',
            width = options.width || 400,
            height = options.height || 300,
            legend = options.legend || null,
            yLabel = options.yLabel || false,
            xLabel = options.xLabel || false,
            chartTitle = options.chartTitle || false,
            margin = options.margin || {top: 30, right: 20, bottom: 60, left: 40},
            vmap = options.vmap || {color: 'lib', x: 'dataSize', y: 'latency'},
            yMax = options.yMax || d3.max(data, function(d) { return d[vmap.y]; });

        var svg = d3.select(container).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scale.ordinal().rangePoints([0, width]),
            y = d3.scale.log().range([height, 0]),
            z = d3.scale.category10();

        var line = d3.svg.line()
            .x(function(d) { return x(d[vmap.x]); })
            .y(function(d) { return y(d[vmap.y]); })
            .interpolate('basis');

        var result =  d3.nest().key(d => d[vmap.color]).entries(data),
            series = result.map(d => d.key);

        console.log(series, result);
        x.domain( d3.nest().key(d => d[vmap.x]).entries(data).map(d => d.key) );
        y.domain([1, Math.pow(10, Math.ceil(Math.log10(yMax)))]);
        // y.domain([0.1, 100]);
        z.domain(series);

        var color = {
            p4gl: 'rgb(44, 160, 44)',
            d3: 'rgb(255, 127, 14)',
            vega: 'steelblue',
            lodash: 'purple',
            stardust: 'rgb(214, 39, 40)',
            'AMD HD7970': 'red',
            'Intel HD520': '#0070c5',
            'Nvidia GTX940m': 'black',
            'Nvidia GTX Titan': 'rgb(44, 160, 44)',
        };

        var names = {
            p4gl: 'P4 (WebGL)',
            d3: 'D3 (SVG)',
            vega: 'Vega (Canvas)',
            stardust: 'Stardust (WebGL)',
            lodash: 'Lodash'
        };

        var name = function(d) {
            if(names.hasOwnProperty(d)) return names[d];
            else return d;
        }

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .innerTickSize(-height)
            .outerTickSize(0)
            .tickPadding(10);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(0, ".1s")
            .innerTickSize(-width)
            .outerTickSize(0)
            .tickPadding(10);

        var xAxis = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)

        xAxis.selectAll('text')
          .attr("dy", ".35em")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");

        if(xLabel) {
            xAxis.append("text")
                .attr("class", "label")
                .attr("x", width/2)
                .attr("y", margin.bottom - 10)
                .style("text-anchor", "middle")
                .style("font-size", "1.1em")
                .text('Number of Data Records')
        }

        var yAxis = svg.append("g")
          .attr("class", "y axis")
          .call(yAxis);

        if(yLabel) {
            yAxis.append("text")
              .attr("class", "label")
              .attr("transform", "rotate(-90)")
              .attr("y", -margin.left)
              .attr("x", -height / 2 )
              .attr("dy", "1.2em")
              .style("text-anchor", "middle")
              .style("font-size", "1.1em")
              .text(options.titleY || 'Time (ms)');
        }


        var trend = svg.selectAll(".lib")
        .data(result)
        .enter().append("g")
          .attr("class", "lib");

        trend.append("path")
          .attr("class", "line")
          .attr("d", function(d) { return line(d.values); })
          .style("stroke-width", 2.5)
          .style("fill", 'none')
          .style("stroke", function(d) { return color[d.key]; });

        // trend.append("text")
        //   .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
        //   .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
        //   .attr("x", 3)
        //   .attr("dy", "0.35em")
        //   .style("font", "10px sans-serif")
        //   .text(function(d) { return d.id; });

        if(chartTitle) {
            var title = svg.append("text")
                .attr("x", width/2)
                .attr("y", -margin.top/3)
                .style("text-anchor", "middle")
                .style("font-size", "0.9em")
                .style("text-transform", "capitalize")
                 .text(chartTitle);
        }
        var accWidth = 0;
        if(legend !== null) {
            legend = svg.append("g")
                .attr("class", "legend")
              .selectAll("g")
                .data(series)
              .enter().append("g")
                .attr("transform", function(d, i) {
                    var t = "translate(" + accWidth + "," + (-margin.top+10) + ")";
                    accWidth += 46+7*name(d).length;
                    console.log(accWidth);
                    return t
                 });

            legend.append("line")
                .style("stroke", function(d) { return color[d]; })
                .style("stroke-width", 5)
                .style("fill", 'none')
                .attr("x2", 20);

            legend.append("text")
                .attr("dy", ".35em")
                .attr("x", 22)
                .text(function(d) { return name(d) });
        }
    }
})
