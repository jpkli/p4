define(function(require){
    var benchmarks = {};
    const defaultDataProps = [
        {name: 'height', dtype: 'float', dist: 'normal', min: 200, max: 230, mean: 0.7, std:0.2},
        {name: 'weight', dtype: 'float', dist: 'normal', min: 170, max: 300, mean: 0.7, std:0.2},
        {name: 'iq', dtype: 'float', dist: 'normal', min: -10, max: 100, mean: 0.7, std:0.2},
        {name: 'age', dtype: 'int', dist: 'normal', min: -16, max: 99, mean: 0.7, std:0.2}
    ];
    const genJsonData = require('./gen-json');

    benchmarks.vega = require('./bench-vega');
    benchmarks.d3 = require('./bench-d3');
    benchmarks.stardust = require('./bench-stardust');
    benchmarks.lodash = require('./bench-lodash');
    benchmarks.p4gl = require('./bench-p4gl');



    var results = {},
        dimensions = dataProps.map( d => d.name );
    var allopts = ['select', 'derive', 'aggregate'];
    return function(arg) {
        var options = arg || {},
            libs = options.libs || Object.keys(benchmarks),
            dataProps = options.dataProps || defaultDataProps,
            trials = options.trials || 10,
            controls = options.controls || null,
            oncomplete = options.oncomplete,
            dopts = options.dopts || allopts,
            dataSize = options.dataSize || Math.pow(2, 10);

        // benchmarks.vega.setup({
        //     lib: vega,
        //     container: {id: '#vis', width: 800, height: 450},
        //     data: {size: dataSize, props: dataProps}
        // })
        // //
        // // var t = benchmarks.vega.dopt.select({
        // //     height: [150, 200]
        // // })
        // //
        // var t = benchmarks.vega.vis.parallelCoordinates({
        //     y: ['height', 'weight', 'iq', 'age']
        //
        // });

        var benchmarkData = [];

        if(dataSize + 1 < Math.pow(2, 23) && !(libs.length == 1 && libs[0] == 'p4gl'))
            benchmarkData = genJsonData({size: dataSize, props: dataProps});

        var deriveExpr = { hw: 'datum.height / datum.weight'},
            selection = {},
            aggregation = {};

        var randomDimension = Math.min(Math.floor((Math.random() * dimensions.length)), dimensions.length-1),
            dataDomain = [dataProps[randomDimension].min, dataProps[randomDimension].max],
            gt = dataDomain[0]+ Math.random() * (dataDomain[1] - dataDomain[0]) * 0.5;
            lt = gt + Math.random() * (dataDomain[1] - dataDomain[0]) * 0.5;

        selection[dataProps[randomDimension].name] = [gt, lt];

        libs.forEach(function(lib) {
            if(controls[lib].skip === true) return;
            console.log('benchmarking ' + lib);
            results[lib] = {};
            var config = {
                container: {id: '#vis', width: 1280, height: 720},
                data: benchmarkData
            };

            if(lib == 'p4gl') config.data = {size: dataSize, props: dataProps};
            var setupTime = benchmarks[lib].setup(config);
            // console.log('initialization time: ', setupTime);
            if(benchmarks[lib].dopt) {
                results[lib] = {setupTime: setupTime};

                results[lib].select = {
                    trials: [],
                    query: selection
                };

                results[lib].derive = {
                    trials: [],
                    query: deriveExpr
                };

                results[lib].aggregate = {
                    trials: [],
                    query: aggregation
                };


                for(var ti = 0; ti < trials; ti++) {
                    // var t = benchmarks[lib].select(selection);

                    randomDimension = Math.floor(Math.min(Math.random() * dimensions.length, dimensions.length-1));

                    results[lib].aggregate.query = {
                        $group: 'age',
                        total: {$sum: dataProps[randomDimension].name}
                    };

                    dopts.forEach(function(opt){
                        var t;
                        if(typeof controls == 'object' && !controls[lib][opt])
                            t = -1;
                        else
                            t = benchmarks[lib].dopt[opt](results[lib][opt].query );
                        results[lib][opt].trials.push(t);
                    })

                    benchmarks[lib].cleanUp();

                    //clean up process to avoid cache
                    benchmarkData.forEach(function(d){
                        delete d.hw;
                    })
                }

                dopts.forEach(function(opt){
                    results[lib][opt].avg = results[lib][opt].trials.reduce((a, b) => a+b) / trials;
                    console.log(lib, opt, results[lib][opt].avg);
                })
                if(typeof oncomplete == 'function') oncomplete(lib, results[lib]);
            }

        });


        console.log(results);
        return results;
    }
})
