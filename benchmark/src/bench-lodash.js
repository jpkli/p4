define(function(require){
    const genData = require('./gen-json');

    var benchmark = {
        lib: null,
        data: null,
        dopt: {},
        vis: {},
        va: {}
    };


    benchmark.setup = function(options) {
        var data = options.data;

        if(!Array.isArray(data)) {
            data = genData({
                size: data.size,
                props: data.props
            });
        }
        var startTime = performance.now();
        benchmark.data = data;
        var lib = options.lib || _ || null;

        benchmark.lib = lib.chain(data);

        return performance.now() - startTime;
    }

    benchmark.cleanUp = function() {

    }

    benchmark.dopt.select = function(options) {

        var attr = Object.keys(options)[0];
        var startTime = performance.now();

        var result = benchmark.lib
            .filter(function(d) { return d[attr] >= options[attr] && d[attr] < options[attr]; })
            .value();


        return performance.now() - startTime;
    }

    benchmark.dopt.derive = function(options) {
        var attr = Object.keys(options)[0],
            formula = options[attr].replace(attr, 'datum.' + attr),
            derive = new Function('datum', 'datum.' + attr + ' = ' + formula);

        var startTime = performance.now();

        var result = benchmark.lib
            .forEach(derive)
            .value();

        return performance.now() - startTime;
    }

    benchmark.dopt.aggregate = function(options) {
        var keys = Object.keys(options).filter(function(d){
            return d !== '$group';
        })
        var startTime = performance.now();
        var result = benchmark.lib
            .groupBy(options.$group)
            .map(function(value, key) {
                var obj = {};
                obj[options.$group] = key;
                keys.forEach(function(d){
                    obj[d] = _.sumBy(value, options[d].$sum);
                })
                return obj;
            })
            .value();

        return performance.now() - startTime;
    }

    return benchmark;
})
