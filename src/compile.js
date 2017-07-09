define(function(require){

    return function(fxgl, fields, spec) {
        var kernels = {
            derive    : require('./derive'),
            perceptual: require('./perceptual'),
            aggregate : require('./aggregate'),
            cache     : require('./cache'),
            filter    : require('./select'),
            stats     : require('./stats'),
            visualize : require('./visualize'),
        };

        var operations = {
            aggregate : kernels.aggregate(fxgl),
            cache     : kernels.cache(fxgl),
            filter    : kernels.filter(fxgl, fields),
            stats     : kernels.stats(fxgl),
            visualize : kernels.visualize(fxgl),
        }

        if(spec.hasOwnProperty('perceptual'))
            operations.perceptual = kernels.perceptual(fxgl);

        if(spec.hasOwnProperty('derive'))
            operations.derive = kernels.derive(fxgl, spec.derive);

        return operations;
    }

});
