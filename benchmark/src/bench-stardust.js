define(function(require){

    const genData = require('src/gen-json'),
        scatterPlot = require('src/plots/stardust-scatter-plot'),
        parallelCoordinates = require('src/plots/stardust-parallel-coordinates');

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
        platform,
        domains = {};

    benchmark.setup = function(options) {
        var data = options.data,
            container = options.container;

        containerId = container.id.slice(1) || 'body';
        width = container.width || 800;
        height = container.height || 450;
        domains = options.domains;
        if(!Array.isArray(data)) {
            data.props.forEach(function(d) {
                domains[d.name] = [d.min, d.max];
            });
            data = genData({
                size: data.size,
                props: data.props
            });
        }

        benchmark.data = data;
        benchmark.lib = options.lib || Stardust || null;

        var div = document.getElementById(containerId),
            canvas = document.createElement('canvas');
        div.appendChild(canvas);
        platform = benchmark.lib.platform("webgl-2d", canvas, width, height);

    }

    benchmark.dopt = false;
    benchmark.vis.parallelCoordinates = function(options) {
        var profile = {},
            ts = performance.now();

        var pcp = parallelCoordinates({
            container: containerId,
            data: benchmark.data,
            vmap: options,
            width: width,
            height: height,
            domains: domains,
            platform: platform
        });

        pcp.init();
        pcp.render();

        profile.total = performance.now() - ts;
        ts = performance.now();
        pcp.render();
        profile.render = performance.now() - ts;
        profile.init = profile.total - profile.render;

        return profile;
    }

    benchmark.vis.scatterPlot = function(options) {
        var profile = {},
            ts = performance.now();

        var scp = scatterPlot({
            container: containerId,
            data: benchmark.data,
            vmap: options,
            width: width,
            height: height,
            domains: domains,
            platform: platform
        });

        scp.init();
        scp.render();

        profile.total = performance.now() - ts;
        ts = performance.now();
        scp.render();
        profile.render = performance.now() - ts;
        profile.init = profile.total - profile.render;

        return profile;
    }

    return benchmark;
});
