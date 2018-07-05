var equal = chai.assert.equal;
var closeTo = chai.assert.closeTo;
var hasAllKeys = chai.assert.hasAllKeys;
var normalDist = jStat.normal.sample;

function validate(actual, expected, _delta) {
    var delta = _delta || 1e-5;
    var count = actual.length; 

    equal(count, actual.length, 'the size of the result should be ' + count);

    for(var i = 0; i < count; i++) {
        var keys = Object.keys(actual[i]);
        hasAllKeys(expected[i], keys, 'result should have all the keys');
        
        for(var j = 0, l = keys.length; j < l; j++) {
            if(typeof(actual[i][keys[j]]) == 'number') {
                closeTo(actual[i][keys[j]], expected[i][keys[j]], delta);
            } else {
                equal(actual[i][keys[j]], expected[i][keys[j]]);
            }
        }
    }

}

function boundedRandom(p) {
    var min = p.min || 0;
    var max = p.max || p.values.length || 1;
    var value = min - 1;
    var rand = (p.dist == 'normal') 
        ? function() { return normalDist(p.mean, p.std); }
        : function() { return min + (max - min) * Math.random(); }
    while ( value < min || value > max) {
        // value = normalDist(p.mean, p.std);
        value = rand(p);
    }
    if(p.hasOwnProperty('values')){
        value = parseInt(value) ;
    }
    return value;
}

function randomColumnArray(arg) {
    var options = arg || {};
    var size = options.size || 0;
    var props = options.props || [];
    var db = p6.cstore({});
    props.forEach(function(prop) {
        var dtype = p6.ctypes[prop.dtype] || Uint16Array;
        var tuples = new dtype(size);
        for(var i = 0; i < size; i++) {
            tuples[i] = boundedRandom(prop);
        }
        db.addColumn({
            data: tuples,
            name: prop.name,
            dtype: prop.dtype || 'string',
            values: prop.values
        });
    })
    return db;
}

function randomObjectArray(arg) {
    var options = arg || {};
    var size = options.size || 0;
    var props = options.props || [];
    var data = new Array(size);
    for(var i = 0; i < size; i++) {
        data[i] = {};
        props.forEach(function(prop) {
            if(prop.hasOwnProperty('values')){
                var vid = parseInt( Math.round( Math.random() * (prop.values.length - 1) ) );
                data[i][prop.name] = prop.values[vid];
            } else {
                var value = boundedRandom(prop);
                data[i][prop.name] = (prop.dtype == 'float') ? parseFloat(value) : parseInt(value);
            }
        });
    }
    return data;
}