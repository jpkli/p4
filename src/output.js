define(function(){

    return function($p) {
        return function(format) {
            var buf = $p.getResult(),
                res = {},
                offset = 0;

            var rs = 0;

            if ($p.resultDimension[0] > 1) {
                res[$p.fields[rs]] = $p.attribute.aIndex0Value.data;
                rs++;
            }

            if ($p.resultDimension[1] > 1) {
                bx = $p.attribute.aIndex0Value.data;
                by = $p.attribute.aIndex1Value.data;
                var ax = new Array($p.resultDimension[0] * $p.resultDimension[1]),
                    ay = new Array($p.resultDimension[0] * $p.resultDimension[1]);

                for (var y = 0; y < $p.resultDimension[1]; y++) {
                    for (var x = 0; x < $p.resultDimension[0]; x++) {

                        ax[y * $p.resultDimension[0] + x] = bx[x];
                        ay[y * $p.resultDimension[0] + x] = by[y]
                    }
                }
                res[$p.fields[0]] = ax;
                res[$p.fields[rs]] = ay;
                rs++;
            }

            var arraySize = $p.resultDimension[0] * $p.resultDimension[1];

            for (var i = rs; i < $p.fields.length; i++) {
                res[$p.fields[i]] = buf.subarray(offset, offset + arraySize);
                offset += arraySize;
            };

            if (format == 'row') {
                var objectArray = new Array(arraySize);

                for (var i = 0; i < arraySize; i++) {
                    var obj = {};
                    Object.keys(res).forEach(function(f) {
                        var kid = $p.dkeys.indexOf(f),
                            dtype = $p.dtypes[kid];

                        if (dtype == 'string' && $p.categoryLookup.hasOwnProperty(f)) {
                            obj[f] = $p.categoryLookup[f][res[f][i]];
                        } else if ($p.intervals.hasOwnProperty(f) && $p.intervals[f].dtype == 'historgram') {
                            obj[f] =  $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
                        } else {
                            obj[f] = res[f][i];
                        }
                    });
                    objectArray[i] = obj;
                }

                return objectArray;

            } else {
                return res;
            }
        }
    }
})
