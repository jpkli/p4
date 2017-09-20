define(function(require){
    const rand = require('./rand'),
        jstat = require('jstat')(),
        ctypes = require('../src/ctypes'),
        cstore = require('../src/cstore');

    var db = new cstore({}),
        tuples;

    return function(arg) {
        var options = arg || {},
            size = options.size || 0,
            props = options.props || [];

        props.forEach(function(prop) {
            tuples = rand({
                min: prop.min || 0,
                max: prop.max || 1,
                mode: prop.dist || 1,
                dtype: ctypes[prop.dtype],
                length: size,
            });

            if(prop.values) {
                for(var ti = 0; ti < size; ti++) {
                    tuples[ti] = prop.values[tuples[ti]];
                }
            }

            db.addColumn({
                data: tuples,
                name: prop.name,
                dtype: prop.dtype
            });
        })

        return db;
    }
})
