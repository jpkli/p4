import p4 from './src/main';
import cstore from './src/cstore';
import  * as ctypes  from './src/ctypes';
import * as ajax from './src/io/ajax';
import parse from './src/io/parse';

var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p4 = p4;
root.p4.ajax = ajax;
root.p4.cstore = cstore;
root.p4.ctypes = ctypes;
root.p4.parse = parse;

export default root.p4;

if(typeof module != 'undefined' && module.exports)
    module.exports = root.p4;