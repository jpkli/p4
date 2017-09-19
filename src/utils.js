define(function(require){
    const ctypes = require('./ctypes');

    var utils = {};

    function seq(dtype, start, end, interval) {
        var step = interval || 1,
            size = (end - start) / step + 1,
            buf;

        buf = new ctypes[dtype](size);
        for (var i = 0; i < size; i++) {
            buf[i] = start + i * step;
        }
        return buf;
    }

    utils.seq = seq;
    utils.seqInt = seq.bind(null, "int");
    utils.seqFloat = seq.bind(null, "float");

    return utils;
})
