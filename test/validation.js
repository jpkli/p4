var equal = chai.assert.equal;
var closeTo = chai.assert.closeTo;
var hasAllKeys = chai.assert.hasAllKeys;

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