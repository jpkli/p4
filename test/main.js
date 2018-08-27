import 'mocha';
import 'mocha/mocha.css';

mocha.setup('bdd');

import test from './test-data';

test();

mocha.checkLeaks();
mocha.run();

