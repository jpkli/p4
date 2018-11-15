export default function($p) {

    let output = {};
    
    output.result = function(format) {
        var buf = $p.getResult(),
            res = {},
            offset = 0,
            rs = 0;
        if(typeof buf.subarray !== 'function') return buf;
        var rs = 0;
        if($p.indexes.length > 0) {
            if ($p.resultDimension[0] > 1) {
                res[$p.fields[rs]] = $p.attribute.aDataValx.data;
                rs++;
            }
            if ($p.resultDimension[1] > 1) {
                var bx = $p.attribute.aDataValx.data;
                var by = $p.attribute.aDataValy.data;
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
                        obj[f] = $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
                    } else if ($p.uniqueValues.hasOwnProperty(f)) {
                        obj[f] = $p.uniqueValues[f][res[f][i]];
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

    output.readPixels = function({
        offset = [0, 0],
        resultSize =  $p.dataDimension[0]* $p.dataDimension[1],
        rowSize = Math.min(resultSize, $p.dataDimension[0]),
        colSize = Math.ceil(resultSize / $p.dataDimension[0])
    }) {
        let result = new Uint8Array(rowSize * colSize * 4);
        $p.bindFramebuffer(null);
        $p.ctx.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, result);
        return result.filter(function(d, i){ return i%4===3;} );
    }

    output.clearViews = function() {
        $p.bindFramebuffer("offScreenFBO");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer("visStats");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer(null);
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
    }

    return output;
}
