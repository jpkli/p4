define(function(){
    return function scatterPlot(option) {
        var margin = option.margin || {top: 20, right: 20, bottom: 30, left: 40},
            width = option.width || 1280,
            height = option.height || 720,
            container = option.container || "body",
            data = option.data || [],
            vmap = option.vmap,
            onupdate = option.onupdate || function(){};

        var profile = {},
            startTime = performance.now();

        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.category10();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(data, function(d) { return d[vmap.x]; }));
        y.domain(d3.extent(data, function(d) { return d[vmap.y]; }));

        profile.init = performance.now() - startTime;
        startTime = performance.now();

        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width)
          .attr("y", -6)
          .style("text-anchor", "end")
          .text(vmap.y);

        svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text(vmap.y);

        svg.selectAll(".dot")
          .data(data)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 2)
          .attr("cx", function(d) { return x(d[vmap.x]); })
          .attr("cy", function(d) { return y(d[vmap.y]); })
          .style('fill-opacity', 0.3)
          .style("fill", function(d) { return (vmap.color) ? color(d[vmap.color]) : 'steelblue'; });

        //   var legend = svg.selectAll(".legend")
        //       .data(color.domain())
        //     .enter().append("g")
        //       .attr("class", "legend")
        //       .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
          //
        //   legend.append("rect")
        //       .attr("x", width - 18)
        //       .attr("width", 18)
        //       .attr("height", 18)
        //       .style("fill", color);
          //
        //   legend.append("text")
        //       .attr("x", width - 24)
        //       .attr("y", 9)
        //       .attr("dy", ".35em")
        //       .style("text-anchor", "end")
        //       .text(function(d) { return d; });
        profile.render = performance.now() - startTime;
        return profile;
    }
})
