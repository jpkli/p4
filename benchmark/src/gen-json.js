define(function(require){
    const normalDist = require('../../test/dist-normal');

    return function(arg) {
        var options = arg || {},
            random = {},
            parser = {},
            size = options.size || 0,
            props = options.props || [];

        var data = new Array(size);

        props.forEach(function(p){
            random[p.name] = (p.dist == 'normal') ? normalDist(p.mean, p.std) : function() { return p.min + (p.max - p.min) * Math.random() };
            parser[p.name] = (p.dtype == 'int') ? parseInt : parseFloat;
        })

        for(var i = 0; i < size; i++) {
            data[i] = {};
            props.forEach(function(p) {
                var value = p.min + (p.max - p.min) * random[p.name]();
                data[i][p.name] = parser[p.name](value);

            });
        }

        return data;
    }
})
