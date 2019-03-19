export default function($p, data, size) {
  let dataSizeToAppend = data.size || size;
 
  let numCols = Math.floor($p.dataSize / $p.dataDimension[0]);
  let offsetX = $p.dataSize - numCols * $p.dataDimension[0];
  const dim = ['x', 'y']
  $p.indexes.forEach( (attr, ai) => {
    $p.attribute['aDataVal' + dim[ai]].update(offsetX, data[attr]);
  })

  $p.fields.slice($p.indexes.length).forEach(function(attr, ai) {
    let buf = new Float32Array(dataSizeToAppend);
    for (let i = 0, l = dataSizeToAppend; i < l; i++) {
        buf[i] = data[attr][i];
    }

    $p.texture.tData.update(
        buf, [offsetX, $p.dataDimension[1] * ai], $p.dataDimension
    );

    $p.dataSize += dataSizeToAppend;
  });
}