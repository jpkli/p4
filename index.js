import p6 from './src/pipeline';
import cstore from './src/cstore';
import  * as ctypes  from './src/ctypes';
import * as ajax from './src/ajax';
import parse     from './src/parse';

var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p6 = p6;
root.p6.ajax = ajax;
root.p6.cstore = cstore;
root.p6.ctypes = ctypes;
root.p6.parse = parse;


