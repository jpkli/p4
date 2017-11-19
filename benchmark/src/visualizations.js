define(function(require){
    var benchmarks = {};
    const defaultDataProps = [];
    const genJsonData = require('./gen-json');
    benchmarks.vega = require('./bench-vega');
    benchmarks.d3 = require('./bench-d3');
    benchmarks.stardust = require('./bench-stardust');
    benchmarks.p4gl = require('./bench-p4gl');

    return function(arg) {
        var options = arg || {},
            libs = options.libs || Object.keys(benchmarks),
            dataProps = options.dataProps || defaultDataProps,
            controls = options.controls || null,
            oncomplete = options.oncomplete,
            plots = options.plots || options.dopts || ['parallelCoordinates', 'scatterPlot'],
            dataSize = options.dataSize || Math.pow(2, 10);

        var results = {},
            dimensions = dataProps.map( d => d.name ),
            colors = ['red', 'blue', 'green', 'blue'];

        var benchmarkData;
        if(dataSize + 1 < Math.pow(2, 23) && !(libs.length == 1 && libs[0] == 'p4gl'))
            benchmarkData = genJsonData({size: dataSize, props: dataProps});

        
        libs.forEach(function(lib) {
            console.log('benchmarking ' + lib);
            results[lib] = {};
            results[lib].scatterPlot = {
                vmap: {
                    id: 'p4vis',
                    x: dimensions[0],
                    y: dimensions[1],
                    // perceptual: 1,
                    // alpha: 0.5,
                }
            };

            results[lib].parallelCoordinates = {
                vmap: {
                    id: 'p4vis',
                    y: dimensions,
                    // alpha: 1
                    // perceptual: 1
                }
            };

            plots.forEach(function(plot) {
                var config = {
                    container: {id: '#'+lib + '-' + plot, width: 1280, height: 720},
                    data: benchmarkData,
                };

                if(lib == 'p4gl') config.data = {size: dataSize, props: dataProps};
                benchmarks[lib].setup(config);
                var options = results[lib][plot].vmap;
                options.color = colors[Math.floor(Math.random() * (colors.length-1))];
                var t = benchmarks[lib].vis[plot](options);

                results[lib][plot].init = t.init;
                results[lib][plot].render = t.render;
                // results[lib][v].avgInit = results[lib][v].initTimes.reduce((a, b) => a+b) / trials;
                // results[lib][v].avgRender = results[lib][v].renderTimes.reduce((a, b) => a+b) / trials;
            })
        });

        return results;
    }


})
