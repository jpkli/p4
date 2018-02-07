var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p4 = require('./src/pipeline');
