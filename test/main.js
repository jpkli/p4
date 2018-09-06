import 'mocha';
import 'mocha/mocha.css';
import Babies from './data-babies';
import testCheck from './test-check';
import testCache from './test-cache';
import testAggregate from './test-aggregate';

let precision = 1e-6;

let babies = new Babies(1000);

let testInput = {
    data: babies.data,
    schema: babies.schema,
    precision
}

testCheck(testInput);

// mocha.setup('bdd');

// testCache(testInput);
// testAggregate(testInput);

// mocha.checkLeaks();
// mocha.run();