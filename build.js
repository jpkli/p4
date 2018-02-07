import p4 from './src/pipeline';
import cstore    from './src/cstore';
import * as ajax from './src/ajax';
import parse     from './src/parse';


window.p4 = p4;
window.p4.ajax = ajax;
window.p4.cstore = cstore;
window.p4.parse = parse;
