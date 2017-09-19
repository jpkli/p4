define(function(){

    return function(context) {
        return function(format) {
            var buf = context.getResult(),
                res = {},
                offset = 0;

            var rs = 0;

            if (context.resultDimension[0] > 1) {
                res[context.fields[rs]] = context.attribute.aIndex0Value.data;
                rs++;
            }

            if (context.resultDimension[1] > 1) {
                bx = context.attribute.aIndex0Value.data;
                by = context.attribute.aIndex1Value.data;
                var ax = new Array(context.resultDimension[0] * context.resultDimension[1]),
                    ay = new Array(context.resultDimension[0] * context.resultDimension[1]);

                for (var y = 0; y < context.resultDimension[1]; y++) {
                    for (var x = 0; x < context.resultDimension[0]; x++) {

                        ax[y * context.resultDimension[0] + x] = bx[x];
                        ay[y * context.resultDimension[0] + x] = by[y]
                    }
                }
                res[context.fields[0]] = ax;
                res[context.fields[rs]] = ay;
                rs++;
            }

            var arraySize = context.resultDimension[0] * context.resultDimension[1];

            for (var i = rs; i < context.fields.length; i++) {
                res[context.fields[i]] = buf.subarray(offset, offset + arraySize);
                offset += arraySize;
            };

            if (format == 'row') {
                var objectArray = new Array(arraySize);

                for (var i = 0; i < arraySize; i++) {
                    var obj = {};
                    Object.keys(res).forEach(function(f) {
                        var kid = context.dkeys.indexOf(f),
                            dtype = context.dtypes[kid];

                        if (dtype == 'string' && context.categoryLookup.hasOwnProperty(f)) {
                            obj[f] = context.categoryLookup[f][res[f][i] - 1];
                        } else if (context.intervals.hasOwnProperty(f) && context.intervals[f].dtype == 'historgram') {
                            obj[f] =  context.intervals[f].min + res[f][i] * context.intervals[f].interval;
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
