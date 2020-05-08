export default function($p) {
  let output = {};
  output.result = function({format = 'row', outputTag = 'fGroupResults'}) {
    let objectArray = new Array();
    let match = null;
    if($p.uniform.uFilterFlag.data == 1){
      match = $p.getMatchBuffer()
    }
    // $p.setInput(outputTag)
    
    for(let edi = 0; edi < $p.extraDimension; edi++) { 

      // if only match is performed and no other write ops, use cache to write source data to framebuffer.
      if($p.getResultBuffer === undefined) { 
        $p.cache('cachedData')
      }
      let buf = $p.getResultBuffer({outputTag, offset: [edi * $p.resultDimension[0], 0]});
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
          let bx = $p.attribute.aDataValx.data;
          let by = $p.attribute.aDataValy.data;
          let ax = new Array($p.resultDimension[0] * $p.resultDimension[1]);
          let ay = new Array($p.resultDimension[0] * $p.resultDimension[1]);

          for (let y = 0; y < $p.resultDimension[1]; y++) {
            for (let x = 0; x < $p.resultDimension[0]; x++) {
              ax[y * $p.resultDimension[0] + x] = bx[x];
              ay[y * $p.resultDimension[0] + x] = by[y]
            }
          }
          res[$p.fields[0]] = ax;
          res[$p.fields[rs]] = ay;
          rs++;
        }
      }
 
      let arraySize = $p.resultDimension[0] * $p.resultDimension[1];
      let fields = $p.fields.filter( f => f !== $p.indexes[2]);
      for (let i = rs; i < fields.length; i++) {
        res[fields[i]] = buf.subarray(offset, offset + arraySize);
        offset += arraySize;
      };

      for (let i = 0; i < arraySize; i++) {
        if(match !== null && match[i] == 0) continue
        let obj = (format == 'array') ? new Array(fields.length) : {};
        if($p.extraDimension > 0 && $p.indexes.length === 3) {
          let fieldName = $p.indexes[2];
          obj[fieldName] = ($p.strLists.hasOwnProperty(fieldName)) ?  $p.strLists[fieldName][edi] : edi + 1;
        } 
        fields.forEach(function(f, fi) {
          // let kid = $p.dkeys.indexOf(f);
          // let dtype = $p.dtypes[kid];
          let key = (format == 'array') ? fi : f;

          if ($p.strLists.hasOwnProperty(f)) {
            obj[key] = $p.strLists[f][res[f][i]];
          } else if ($p.intervals.hasOwnProperty(f) && $p.intervals[f].dtype == 'histogram') {
            obj[key] = $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
          } else if ($p.uniqueValues && $p.uniqueValues.hasOwnProperty(f)) {
            obj[key] = $p.uniqueValues[f][res[f][i]];
          } else {
            obj[key] = res[f][i];
          }
        });
        objectArray.push(obj);
      }
    }
    if($p.extraDimension === 1 && objectArray.length > $p.dataSize) {
      objectArray = objectArray.slice(0, $p.dataSize);
    }
    return objectArray;
  }

  output.toArray = () => output.result({format: 'array'})
  output.toJson = () => output.result({format: 'json'})
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
