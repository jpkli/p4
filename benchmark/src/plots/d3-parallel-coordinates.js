define(function(){
    return function parallelCoordinate(option) {
        var margin = option.margin || {top: 30, right: 10, bottom: 10, left: 10},
            width = option.width || 1280,
            height = option.height || 720,
            container = option.container || "body",
            data = option.data || [],
            dimensions = option.attributes || d3.keys(data[0]) || [],
            lineColor = option.color || 'steelblue',
            onupdate = option.onupdate || function(){};

        width -=  (margin.left + margin.right);
        height -= (margin.top + margin.bottom);

        var profile = {},
            startTime = performance.now();

        var x = d3.scale.ordinal().rangePoints([0, width], 1),
            y = {},
            dragging = {};

        var line = d3.svg.line(),
            axis = d3.svg.axis().orient("left"),
            background,
            foreground;

        var svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        function position(d) {
          var v = dragging[d];
          return v == null ? x(d) : v;
        }

        function transition(g) {
          return g.transition().duration(500);
        }

        // Returns the path for a given data point.
        function path(d) {
          return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
        }

        function brushstart() {
          d3.event.sourceEvent.stopPropagation();
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
          var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });

          foreground.style("display", function(d) {
            return actives.every(function(p, i) {
              return result = extents[i][0] <= d[p] && d[p] <= extents[i][1];

            }) ? null : "none";
          });
        }

        function brushend() {
            var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
                extents = actives.map(function(p) { return y[p].brush.extent(); });

           var result = data.filter(function(d, di) {
              return actives.every(function(p, i) {
                return extents[i][0] <= d[p] && d[p] <= extents[i][1];
              });
            });

            onupdate(result);
        }

        // Extract the list of dimensions and create a scale for each.
        x.domain(dimensions);
        dimensions.forEach(function(d) {
            y[d] = d3.scale.linear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([height, 0]);
        })


        profile.init = performance.now() - startTime;
        startTime = performance.now();
        // Add grey background lines for context.
        background = svg.append("g")
          .attr("class", "background")
        .selectAll("path")
          .data(data)
        .enter().append("path")
          .style('fill', 'none')
          .style('stroke', '#ddd')
        //   .style('stroke-width', 0.5)
          .style('shape-rendering', 'crispEdges')
          .attr("d", path);

        // Add blue foreground lines for focus.
        foreground = svg.append("g")
          .attr("class", "foreground")
        .selectAll("path")
          .data(data)
        .enter().append("path")
          .style('fill', 'none')
          .style('stroke-opacity', 0.15)
        //   .style('stroke-width', 1.0)
          .style('stroke', lineColor)
          .attr("d", path);

        // Add a group element for each dimension.
        var g = svg.selectAll(".dimension")
          .data(dimensions)
        .enter().append("g")
          .attr("class", "dimension")
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        //   .call(d3.behavior.drag()
        //     .origin(function(d) { return {x: x(d)}; })
        //     .on("dragstart", function(d) {
        //       dragging[d] = x(d);
        //       background.attr("visibility", "hidden");
        //     })
        //     .on("drag", function(d) {
        //       dragging[d] = Math.min(width, Math.max(0, d3.event.x));
        //       foreground.attr("d", path);
        //       dimensions.sort(function(a, b) { return position(a) - position(b); });
        //       x.domain(dimensions);
        //       g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        //     })
        //     .on("dragend", function(d) {
        //       delete dragging[d];
        //       transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
        //       transition(foreground).attr("d", path);
        //       background
        //           .attr("d", path)
        //         .transition()
        //           .delay(500)
        //           .duration(0)
        //           .attr("visibility", null);
        //     }));

        // Add an axis and title.
        g.append("g")
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
          .style("text-anchor", "middle")
          .style("font-size", "16px")
          .attr("y", -9)
          .text(function(d) { return d.split("_").join(" "); });

        // Add and store a brush for each axis.
        g.append("g")
          .attr("class", "brush")
          .each(function(d) {
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush).on("brushend", brushend));
          })
        .selectAll("rect")
          .attr("x", -8)
          .attr("width", 16);

        profile.render = performance.now() - startTime;

        return profile;

  }
})
