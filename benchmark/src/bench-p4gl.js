define(function(require){
    const genData = require('./gen-binary'),
        P4GL = require('../../src/pipeline');

    var benchmark = {
        lib: null,
        data: null,
        dopt: {},
        vis: {},
        va: {}
    };

    var setupTime;

    benchmark.setup = function(options) {
        var dataProps = options.data;

        var data = genData({
        size: dataProps.size,
            props: dataProps.props
        });

        benchmark.data = data;
        var config = options,
            container = options.container;
        config.data = benchmark.data;
        config.container = container.id.slice(1);

        config.viewport = [container.width, container.height];
        var startTime = performance.now();
        benchmark.lib = P4GL(config);
        benchmark.lib.ctx.finish();
        setupTime = performance.now() - startTime;

        return setupTime;
    }

    benchmark.cleanUp = function() {

    }

    benchmark.dopt.select = function(options) {
        benchmark.lib.head();
        var startTime = performance.now();
        benchmark.lib.select(options);
        // benchmark.lib.ctx.finish();
        benchmark.lib.getResult({size:1});

        return performance.now() - startTime;
    }

    benchmark.dopt.derive = function(options) {

        var attr = Object.keys(options)[0],
            formula = {};

        formula[attr] = options[attr].replace(/datum./g, '');

        benchmark.lib.head();
        var startTime = performance.now();
        benchmark.lib.derive(formula);
        benchmark.lib.ctx.finish();
        // benchmark.lib.getResult({size:1});
        return performance.now() - startTime;
    }

    benchmark.dopt.aggregate = function(options) {
        benchmark.lib.head();
        var startTime = performance.now();
        benchmark.lib.aggregate(options);
        // benchmark.lib.ctx.finish();
        // console.log(benchmark.lib.result('row'));
        // var r= benchmark.lib.getResult({size:1});

        return performance.now() - startTime;
    }

    benchmark.vis.scatterPlot = function(options) {
        var visSetting = options;
        benchmark.lib.head();
        var startTime = performance.now();
        visSetting.mark = 'point';
        benchmark.lib.visualize(visSetting);
        // benchmark.lib.ctx.finish();
        benchmark.lib.readPixels({size:1});
        return {
            init: setupTime,
            render: performance.now() - startTime
        }
    }

    benchmark.vis.parallelCoordinates = function(options) {
        var visSetting = options;
        benchmark.lib.head();
        var startTime = performance.now();
        visSetting.mark = 'line';
        benchmark.lib.visualize(visSetting);
        // benchmark.lib.ctx.finish();
        benchmark.lib.readPixels({size:1});
        return {
            init: setupTime,
            render: performance.now() - startTime
        }
    }

    benchmark.va.histogram = function(options) {

    }

    return benchmark;
})
