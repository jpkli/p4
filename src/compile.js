define(function(require){

    return function(fxgl, fields, spec) {
        var kernels = {
            derive    : require('./derive'),
            reveal    : require('./reveal'),
            aggregate : require('./aggregate'),
            cache     : require('./cache'),
            select    : require('./select'),
            extent    : require('./extent'),
            visualize : require('./visualize'),
        };

        var operations = {
            aggregate : kernels.aggregate(fxgl),
            cache     : kernels.cache(fxgl),
            select    : kernels.select(fxgl, fields),
            extent    : kernels.extent(fxgl),
            visualize : kernels.visualize(fxgl),
            // perceive  : kernels.reveal(fxgl)
        }

        // if(spec.hasOwnProperty('perceptual'))
        //     operations.perceptual = kernels.perceptual(fxgl);
        //
        // if(spec.hasOwnProperty('derive'))
        //     operations.derive = kernels.derive(fxgl, spec.derive);

        return operations;
    }

});
