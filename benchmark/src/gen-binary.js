define(function(require) {
    const normalDist = require('../../test/dist-normal'),
        ctypes = require('../../src/ctypes'),
        cstore = require('../../src/cstore');

    function rand(arg){
        var options = arg || {},
            min = options.min || 0,
            max = options.max || 1,
            mean = options.mean || (max - min) / 2,
            std = options.std || mean / 2,
            dtype = options.dtype || Float32Array,
            dist = options.dist || 'normal',
            size = options.size || 0;

        var tuples = new dtype(size),
            random = (dist == 'normal')
                ? normalDist(mean, std)
                : function() { return min + (max - min) * Math.random(); };

        for(var i = 0; i < size; i++) {
            var value;
            do {
                value = random();
            } while ( value < min || value > max);
            tuples[i] = value;
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
            var max = prop.max,
                min = prop.min;
            if(prop.values) {
                min = 0;
                max = prop.values.length ;
            }

            tuples = rand({
                min: min,
                max: max,
                mean: prop.mean || 0,
                std: prop.std || 0,
                dtype: ctypes[prop.dtype],
                dist: prop.dist || 'normal',
                size: size,
            });

            // if(prop.values) {
            //     for(var ti = 0; ti < size; ti++) {
            //         tuples[ti] = prop.values[parseInt(tuples[ti])];
            //     }
            // }

            db.addColumn({
                data: tuples,
                name: prop.name,
                dtype: prop.dtype,
                values: prop.values
            });
        })

        var data = db.data();
        console.log(data);

        data.stats = db.stats();
        var metadata = db.metadata();
        data.keys = metadata.attributes;
        data.size = metadata.size;
        data.CAMs = metadata.CAMs;
        data.TLBs = metadata.TLBs;
        data.dtypes = metadata.types;
        return data;
    }
})
