define(function(require){

    const genData = require('src/gen-json'),
        scatterPlot = require('src/plots/d3-scatter-plot'),
        parallelCoordinates = require('src/plots/d3-parallel-coordinates');

    var benchmark = {
        lib: null,
        data: null,
        dopt: {},
        vis: {},
        va: {}
    };

    var spec,
        containerId,
        width,
        height,
        domains = {},
        svg,
        setupTime;
        visualItems = null;

    benchmark.setup = function(options) {
        var data = options.data,
            container = options.container;

        containerId = container.id || 'body';
        width = container.width || 800;
        height = container.height || 450;

        if(!Array.isArray(data)) {
            data = genData({
                size: data.size,
                props: data.props
            });
        }

        var startTime = performance.now();
        benchmark.data = data;
        benchmark.lib = options.lib || d3 || null;

        svg = d3.select(containerId).append("svg");
        setupTime = performance.now() - startTime;

        return setupTime;
    }

    benchmark.cleanUp = function() {
        if(visualItems !== null) visualItems.remove();
        svg.remove();
        visualItems = null;
        document.getElementById(containerId.slice(1)).innerHTML = '';
    }

    benchmark.dopt.select = function(options) {
        var attr = Object.keys(options)[0];
        if(visualItems === null) {
            visualItems = svg.selectAll("rect")
                .data(benchmark.data).enter()
                .append("rect");
        }
        var startTime = performance.now();
        visualItems.filter(function(d) {return d[attr] >= options[attr] && d[attr] < options[attr]; });

        return performance.now() - startTime;
    }

    benchmark.dopt.derive = function(options) {
        var attr = Object.keys(options)[0],
            formula = options[attr].replace(attr, 'datum.' + attr),
            derive = new Function('datum', 'return ' + formula);

        var startTime = performance.now();

        var result = d3.nest()
          .key(derive)
          .entries(benchmark.data)

        return performance.now() - startTime;
    }

    benchmark.dopt.aggregate = function(options) {
        var keys = Object.keys(options).filter(function(d){
            return d !== '$group';
        })

        var metrics = {};

        function rollup(v) {
            keys.forEach(function(k){
                var opt = Object.keys(options[k])[0],
                    attr = options[k][opt];

                metrics[k] = d3.sum(v, function(d) { return d[attr]; })
            })
            return metrics;
        }

        var startTime = performance.now();

        var result = d3.nest()
          .key(function(d) { return d[options.$group]; })
          .rollup(rollup)
          .entries(benchmark.data)

        return performance.now() - startTime;
    }

    benchmark.vis.parallelCoordinates = function(options) {
        var attributes = options.y;

        var startTime = performance.now();

        return parallelCoordinates({
            container: containerId,
            data: benchmark.data,
            attributes: attributes
        });

    }

    benchmark.vis.scatterPlot = function(options) {
        var startTime = performance.now();

        return scatterPlot({
            container: containerId,
            data: benchmark.data,
            vmap: options
        });

    }

    return benchmark;
});
