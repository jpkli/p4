const normalDist = require('jStat').normal.sample;
const ctypes = p6.ctypes;
const cstore = p6.cstore;

let boundedRandom = function(p) {
    var min = p.min || 0;
    var max = p.max || 1;
    var value = p.min - 1;
    var rand = (p.dist == 'normal') 
        ? function() { return normalDist(p.mean, p.std);} 
        : function() { return min + (max - min) * Math.random(); };
    
    while ( value < min || value > max) {
        value = rand();
    }

    if(p.hasOwnProperty('values')){
        value = p.values[parseInt(p.values.length * value)];
    } 
    
    return value;
}

let generateData = function(arg) {
    let options = arg || {};
    let size = options.size || 0;
    let props = options.props || [];

    let db = new cstore({});

    props.forEach(function(prop) {
        let dtype = prop.dtype || Float32Array;
        let tuples = new dtype(size);

        for(var i = 0; i < size; i++) {
            tuples[i] = boundedRandom(prop);
        }

        db.addColumn({
            data: tuples,
            name: prop.name,
            dtype: prop.dtype
        });
    })

    return db;
}

module.exports = generateData;