define(function(require){
    const jstat = require('jstat')();

    return function(arg) {
        var options = arg || {},
            random = {},
            parser = {},
            size = options.size || 0,
            props = options.props || [];

        var data = new Array(size);

        props.forEach(function(prop){
            random[prop.name] = (prop.dist == 'normal') ? function() { return jstat.normal(prop.mean, prop.std).sample() } : Math.random;
            parser[prop.name] = (prop.dtype == 'int') ? parseInt : parseFloat;
        })

        for(var i = 0; i < size; i++) {
            data[i] = {};
            props.forEach(function(p){
                var value = p.min + (p.max - p.min) * random[p.name]();
                data[i][p.name] = parser[p.name](value);
            });
        }

        return data;
    }
})
