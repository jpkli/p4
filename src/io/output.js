export default function($p) {

    let output = {};
    
    output.result = function(format) {
        let objectArray = new Array();
        let match = null;
        if($p.uniform.uFilterFlag.data == 1){
            match = $p.getMatchBuffer()
        }
        for(let edi = 0; edi < $p.extraDimension; edi++) { 
            let buf = $p.getResultBuffer({offset: [edi * $p.resultDimension[0], 0]});
            let res = {};
            let offset = 0;
            let rs = 0;
            if(typeof buf.subarray !== 'function') return buf;

            if($p.indexes.length > 0) {
                if ($p.resultDimension[0] > 1) {
                    res[$p.fields[rs]] = $p.attribute.aDataValx.data;
                    rs++;
                }
                if ($p.resultDimension[1] > 1) {
                    var bx = $p.attribute.aDataValx.data;
                    var by = $p.attribute.aDataValy.data;
                    var ax = new Array($p.resultDimension[0] * $p.resultDimension[1]);
                    var ay = new Array($p.resultDimension[0] * $p.resultDimension[1]);

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
            let fields = $p.fields.filter( f => f !== $p.indexes[2]);
            for (var i = rs; i < fields.length; i++) {
                res[fields[i]] = buf.subarray(offset, offset + arraySize);
                offset += arraySize;
            };

        
            for (var i = 0; i < arraySize; i++) {
                if(match !== null && match[i] == 0) continue
    
                var obj = (format == 'array') ? new Array(fields.length) : {};
                if($p.extraDimension > 0 && $p.indexes.length === 3) {
                    let fieldName = $p.indexes[2];
                    obj[fieldName] = ($p.strLists.hasOwnProperty(fieldName)) ?  $p.strLists[fieldName][edi] : edi;
                } 
                fields.forEach(function(f, fi) {
                    var kid = $p.dkeys.indexOf(f),
                        dtype = $p.dtypes[kid];

                    var key = (format == 'array') ? fi : f;

                    if (dtype == 'string' && $p.strLists.hasOwnProperty(f)) {
                        obj[key] = $p.strLists[f][res[f][i]];
                    } else if ($p.intervals.hasOwnProperty(f) && $p.intervals[f].dtype == 'histogram') {
                        obj[key] = $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
                    } else if ($p.uniqueValues.hasOwnProperty(f)) {
                        obj[key] = $p.uniqueValues[f][res[f][i]];
                    } else {
                        obj[key] = Number.isNaN(res[f][i]) ? 0.0 : res[f][i];
                    }


                });
                objectArray.push(obj);
            }
        }
        return objectArray;

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
    
    return output;
}
