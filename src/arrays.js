function _reduce(array, opt) {
    var i,
        len = array.length,
        fn,
        result;

    if (!len) return 0;

    switch (opt) {
        case "max":
            result = array.reduce(function(a, b) {
                return (a > b) ? a : b;
            });
            break;
        case "min":
            result = array.reduce(function(a, b) {
                return (a < b) ? a : b;
            });
            break;
        case "and":
        case "&":
            result = array.reduce(function(a, b) {
                return a & b;
            });
            break;
        case "or":
        case "|":
            result = array.reduce(function(a, b) {
                return a | b;
            });
            break;
        case "mult":
        case "*":
            result = array.reduce(function(a, b) {
                return a * b;
            });
            break;
        default: // "sum" or "+"
            result = array.reduce(function(a, b) {
                return a + b;
            });
            break;
    }

    return result;
}

export function reduce(opt) {
    return function(array) {
        var a = (array instanceof Array) ? array : Array.apply(null, arguments);
        return _reduce(a, opt);
    };
};

export function avg(array) {
    return _reduce(array, "+") / array.length;
    // return array.reduce(function(a,b){ return 0.5 * (a + b)});
};

export function normalize(array) {
    var max = _reduce(array, "max"),
        min = _reduce(array, "min"),
        range = max - min;

    return array.map(function(a) {
        return (a - min) / range;
    });
}

export function seq(start, end, intv) {
    var interval = intv || 1,
        array = [];

    for (var i = start; i <= end; i += interval)
        array.push(i);

    return array;
};

// ["max", "min", "mult", "and", "or"].forEach(function(f) {
//     array[f] = array.reduce(f);
// });

// export sum = array.reduce("+");

export function scan(a) {
    var pfsum = [],
        accum = 0;

    for (var i = 0; i < a.length; i++) {
        accum += a[i];
        pfsum.push(accum);
    }

    return pfsum;
};

export function iscan(a) {
    return array.scan([0].concat(a));
};

export function diff(a, b) {
    var difference = [];
    a.forEach(function(d) {
        if (b.indexOf(d) === -1) {
            difference.push(d);
        }
    });
    return difference;
};

export function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function(e) {
        if (b.indexOf(e) !== -1) return true;
    });
};

export function unique(a) {
    return a.reduce(function(b, c) {
        if (b.indexOf(c) < 0) b.push(c);
        return b;
    }, []);
};

export function lcm(A) {
    var n = A.length,
        a = Math.abs(A[0]);
    for (var i = 1; i < n; i++) {
        var b = Math.abs(A[i]),
            c = a;
        while (a && b) {
            (a > b) ? a %= b: b %= a;
        }
        a = Math.abs(c * A[i]) / (a + b);
    }
    return a;
};

export function stats(array) {
    return {
        max: _reduce(array, "max"),
        min: _reduce(array, "min"),
        avg: array.avg(array)
    };
};

export function histogram(array, numBin, _max, _min) {
    var l = array.length,
        min = (typeof(_min) == 'number') ? _min : _reduce(array, "min"),
        max = (typeof(_max) == 'number') ? _max : _reduce(array, "max"),
        range = max - min,
        interval = range / numBin,
        bins = [],
        // ids = [],
        hg = new Array(numBin + 1).fill(0);

    for (var b = 0; b < numBin; b++) {
        bins.push([min + range * (b / (numBin)), min + range * (b + 1) / (numBin)]);
        // ids[b] = [];
    }

    // ids[numBin] = [];

    for (var i = 0; i < l; i++) {
        binID = Math.floor((array[i] - min) / range * (numBin));
        hg[binID]++;
        // ids[binID].push(i);
    };

    hg[numBin - 1] += hg[numBin];
    // ids[numBin-1] = ids[numBin-1].concat(ids.pop());
    return {
        bins: bins,
        counts: hg.slice(0, numBin),
        // ids: ids
    };
}

export function variance(rowArray) {
    var m = _reduce(rowArray, "+") / rowArray.length,
        va = rowArray.map(function(a) {
            return Math.pow(a - m, 2)
        });

    return _reduce(va, "+") / (rowArray.length - 1);
}

export function std(rowArray) {
    return Math.sqrt(variance(rowArray));
}

export function vectorAdd(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = v + b[i];
    });

    return c;
}

export function vectorSum(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = array.vectorAdd(result, vectors[i]);
    }

    return result;
}

function _vectorAvg(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = (v + b[i]) * 0.5;
    });

    return c;
}

export function vectorAvg(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = _vectorAvg(result, vectors[i]);
    }

    return result;
}
