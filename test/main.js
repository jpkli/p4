import 'mocha';
import 'mocha/mocha.css';
import { randomJSONs } from './utils';

let precision = 1e-6;
import testCache from './test-cache';
import testAggregate from './test-aggregate';


let dataProps = [
    {name: 'Gender', dtype: 'string', values: ['F', 'M'] },
    {name: 'Weight', dtype: 'float', dist: 'normal', min: 2, max: 20, mean: 7, std: 2},
    {name: 'MotherWeight', dtype: 'float', dist: 'normal', min: 50, max: 290, mean: 100, std: 50},
    {name: 'MotherRace', dtype: 'string', values: ['White', 'Asian', 'Black', 'Mixed'] },
    {name: 'MotherAge', dtype: 'int', dist: 'normal', min: 16, max: 70, mean: 40, std:25}
];

let schema = {};
for(let prop of dataProps) {
    schema[prop.name] = prop.dtype;
}

let data = randomJSONs({props: dataProps, size: 1000});
let testInput = {
    data,
    schema,
    precision
}

mocha.setup('bdd');

testCache(testInput);
testAggregate(testInput);

mocha.checkLeaks();
mocha.run();

