import 'mocha';
import 'mocha/mocha.css';
import Babies from './data-babies';
import TimeSeries from './data-timeseries';
import testCheck from './test-check';
import testCache from './test-cache';
import testAggregate from './test-aggregate';
import testTS from './test-timeseries';
import testDataInput from './test-input';

let url = new URL(window.location.href);
let precision = 1e-6;

let babies = new Babies(1000);

let testInput = {
    data: babies.data,
    schema: babies.schema,
    precision
}

if (url.searchParams.get('check') !== null) {
    testCheck(testInput);
} else if (url.searchParams.get('ts') !== null) {
    testTS();
} else if (url.searchParams.get('input') !== null) {
    testDataInput();
} else {
    mocha.setup('bdd');

    testCache(testInput);
    testAggregate(testInput);

    mocha.checkLeaks();
    mocha.run();
}