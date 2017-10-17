define(function(require) {
    const jstat = require('jstat')(),
        ctypes = require('src/ctypes'),
        cstore = require('src/cstore');

    function rand(arg){
        var options = arg || {},
            mean = options.mean || 0,
            std = options.std || 1,
            min = options.min || 0,
            max = options.max || 1,
            dtype = options.dtype || Float32Array,
            dist = options.dist || 'normal',
            size = options.size || 0;

        var tuples = new dtype(size),
            random = (dist == 'normal') ? function() { return jstat.normal(mean, std).sample() } : Math.random;

        for(var i = 0; i < size; i++) {
            tuples[i] = min + (max - min) * random();
        }

        return tuples;
    }

    return function(arg) {
        var options = arg || {},
            size = options.size || 0,
            props = options.props || [];

        var db = new cstore({}),
            tuples;

        props.forEach(function(prop) {
            tuples = rand({
                min: prop.min || 0,
                max: prop.max || 1,
                mean: prop.mean || 0,
                std: prop.std || 0,
                dtype: ctypes[prop.dtype],
                dist: prop.dist || 'normal',
                size: size,
            });

            if(prop.values) {
                for(var ti = 0; ti < size; ti++) {
                    tuples[ti] = prop.values[parseInt(tuples[ti])];
                }
            }

            db.addColumn({
                data: tuples,
                name: prop.name,
                dtype: prop.dtype
            });
        })

        var data = db.data();
        data.stats = db.stats();
        var metadata = db.metadata();
        data.keys = metadata.attributes;
        data.size = metadata.size;

        return data;
    }
})
