define(function(require){

    const pipeline = require('./pipeline');

    return function(dsl){
        var configs = dsl.configs || dsl.config || {},
            dataOptions = dsl.data || {},
            specs = dsl.pipeline || dsl.process || [];

        var program = pipeline(configs);

        program.data(dataOptions);

        specs.forEach(function(spec){
            var opt = Object.keys(spec)[0],
                arg = spec[opt];

            opt = opt.slice(1);
            if(typeof program[opt] == 'function') {
                program[opt](arg);
            }
        })
    }
});
