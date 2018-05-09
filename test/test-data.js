var assert = chai.assert;

var dataProps = [
    {name: 'Gender', values: ['F', 'M'] },
    {name: 'Weight', dtype: 'float', dist: 'normal', min: 2, max: 20, mean: 7, std: 2},
    {name: 'MotherWeight', dtype: 'float', dist: 'normal', min: 50, max: 290, mean: 100, std: 50},
    {name: 'MotherRace', values: ['White', 'Asian', 'Black', 'Mixed'] },
    {name: 'MotherAge', dtype: 'int', dist: 'normal', min: 16, max: 70, mean: 40, std:25}
];
// var db = randomColumnArray({props: dataProps, size: 100});

var db = p6.cstore();
var inputData = randomObjectArray({props: dataProps, size: 1000});

db.import({
    data: inputData,
    schema: {
        Gender: 'string',
        Weight: 'float',
        MotherWeight: 'float',
        MotherRace: 'string',
        MotherAge: 'int'
    }
})
var dataInfo = db.info();
var outputData = db.export();
var precision = 1e-4;

describe('data info', function() {

    it('result length should equal ' + inputData.length, function() {
        assert.equal(outputData.length, inputData.length);
    });

    it('result should be closely equal with delta = 1e-4', function() {
        validate(inputData, outputData, 1e-4);
    });

});