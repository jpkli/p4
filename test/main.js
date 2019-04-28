import 'mocha';
import 'mocha/mocha.css';
import Babies from './data-babies';
import TimeSeries from './data-timeseries';
import testCheck from './test-check';
import testCache from './test-cache';
import testAggregate from './test-aggregate';
import testMatch from './test-match';
import testTS from './test-timeseries';
import testDataInput from './test-input';
import testMap from './test-map';
import testVis from './test-vis';

let url = new URL(window.location.href);
let precision = 1e-5;

let babies = new Babies(100000);

let testInput = {
    data: babies.data,
    schema: babies.schema,
    precision
}

function runMochaTest(testBed) {
    mocha.setup('bdd');
    testBed(testInput);
    mocha.checkLeaks();
    mocha.run();
}

if (url.searchParams.get('check') !== null) {
    testCheck(testInput);
} else if (url.searchParams.get('ts') !== null) {
    testTS();
} else if (url.searchParams.get('input') !== null) {
    testDataInput();
} else if (url.searchParams.get('map') !== null) {
    testMap();
} else if (url.searchParams.get('vis') !== null) {
    testVis(testInput);
} else if (url.searchParams.get('match') !== null) {
    runMochaTest(testMatch);
} else if (url.searchParams.get('cache') !== null) {
    runMochaTest(testCache);
} else {
    runMochaTest(testAggregate);
}
