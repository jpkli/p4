import {seqFloat} from './utils';
import {unique} from './arrays';
import setupGPU from './setupGPU';
const vecId = ['x', 'y', 'z'];
export default function($p, dataProps) {
    let data = dataProps || [];
    $p.indexes = data.indexes || [];
    $p.categoryIndex = data.strValues || {};
    $p.strValues = data.strValues || {};
    $p.strLists = data.strLists || {};
    $p.dkeys =  data.keys || [];
    $p.dtypes =  data.dtypes || data.types || [];
    $p.intervals =  data.intervals || {};
    $p.uniqueValues = data.uniqueValues;
    $p.dataSchema = data.struct;

    let dkeys = $p.dkeys;
    let dtypes = $p.dtypes;
    let stats =  data.stats || null;
    
    if (Number.isInteger(data.size)) {
        $p.dataSize = data.size;
    } else if (Array.isArray(data)) {
        $p.dataSize = Math.max(...data.map(d => d.length));
    }

    let rowSize = Math.min($p.dataSize, $p.rowSize);
    let colSize = Math.ceil($p.dataSize / rowSize);

    $p.dataDimension = [rowSize, colSize];
    $p.resultDimension = [rowSize, colSize];
    $p.fields = $p.indexes.concat(dkeys.filter(function(k) {
        return $p.indexes.indexOf(k) === -1;
    }));
    $p.fieldWidths = new Array($p.fields.length).concat(new Array($p.deriveMax).fill(1));
    $p.fieldCount = $p.fields.length - $p.indexes.length;
   
    function getDataWidth(fid, range) {
        var range = Math.abs(range[1] - range[0]);
        if (dtypes[fid] == "index" || dtypes[fid] == "int" || dtypes[fid] == "string") {
            return range + 1;
        } else if (dtypes[fid] == "histogram") {
            return range + 1;
        } else if (["nominal", "ordinal", "categorical"].indexOf(dtypes[fid]) > -1) {
            return data.TLB.length;
        } else if (["float", "double", "numeric"].indexOf(dtypes[fid]) !== -1) {
            return 10;
        } else {
            return range + 1;
        }
    }
    $p.fields.forEach(function(field) {
        var min = stats[field].min,
            max = stats[field].max,
            fi = dkeys.indexOf(field);
        $p.fieldWidths[fi] = getDataWidth(fi, [min, max]);
    });
    $p.getDataWidth = getDataWidth;
    $p.deriveDomains = new Array($p.deriveMax).fill([0, 1]);
    $p.deriveWidths = new Array($p.deriveMax).fill(1);
    $p.deriveFieldCount = 0;

    if ($p.indexes.length === 0) {
        $p.attribute("aDataIdx", "float", seqFloat(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataIdy", "float", seqFloat(0, $p.dataDimension[1] - 1));
        $p.attribute("aDataValx", "float", seqFloat(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataValy", "float", seqFloat(0, $p.dataDimension[1] - 1));
    } else {
        $p.indexes.forEach(function(id, i) {
            let indexAttrData = unique(data[id]).sort( (a, b) => b - a );
            $p.attribute("aDataVal" + vecId[i], "float", new Float32Array(indexAttrData));
            $p.attribute("aDataId" + vecId[i], "float", seqFloat(0, indexAttrData.length - 1));
            $p.fieldWidths[i] = indexAttrData.length;
            $p.dataDimension[i] = indexAttrData.length;
        });
    }

    //TODO: get data statistics using the GPU
    if(stats !== null) {
        $p.fieldDomains = $p.fields.map(function(k, i) {
            return [stats[k].min, stats[k].max];
        }).concat(new Array($p.deriveMax).fill([0, 1]));
    } else {
        $p.fieldDomains = $p.fields.map(f => [0, 1]);
    }

    setupGPU($p);

    $p.fields.slice($p.indexes.length).forEach(function(attr, ai) {
        let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
        for (let i = 0, l = data[attr].length; i < l; i++) {
            buf[i] = data[attr][i];
        }

        $p.texture.tData.update(
            buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
        );
    });

    $p.uniform.uDataInput = $p.texture.tData;

    var gl = $p.ctx;
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

}
