import * as ctypes from './ctypes';

export function seq(dtype, start, end, interval) {
    var step = interval || 1,
        size = (end - start) / step + 1,
        buf;

    buf = new ctypes[dtype](size);
    for (var i = 0; i < size; i++) {
        buf[i] = start + i * step;
    }
    return buf;
}

export let seqInt = seq.bind(null, "int");
export let seqFloat = seq.bind(null, "float");
