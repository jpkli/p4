import {seqFloat} from './utils';
import setupGPU from './setupGPU';

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
    $p.dataSchema = data.schema || data.struct;

    if($p.dataSchema) {
        $p.dkeys = Object.keys($p.dataSchema);
        $p.dtypes = $p.dkeys.map(k => $p.dataSchema[k]);
    }

    let allocSize = data.size || 0;
    let dkeys = $p.dkeys;
    let dtypes = $p.dtypes;

    $p.dataSize = 0;
    let rowSize = Math.min(allocSize, $p.rowSize);
    let colSize = Math.ceil(allocSize / rowSize);

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
        } else if (["float", "double", "numeric"].indexOf(dtypes[fid]) !== -1) {
            return 10;
        } else {
            return range + 1;
        }
    }

    $p.getDataWidth = getDataWidth;
    $p.fieldDomains = $p.fields.map(f => [0, 1]);
    $p.deriveDomains = new Array($p.deriveMax).fill([0, 1]);
    $p.deriveWidths = new Array($p.deriveMax).fill(1);
    $p.deriveFieldCount = 0;

    $p.attribute("aDataIdx", "float", seqFloat(0, $p.dataDimension[0] - 1));
    $p.attribute("aDataIdy", "float", seqFloat(0, $p.dataDimension[1] - 1));
    $p.attribute("aDataValx", "float", seqFloat(0, $p.dataDimension[0] - 1));
    $p.attribute("aDataValy", "float", seqFloat(0, $p.dataDimension[1] - 1));

    setupGPU($p);

    $p.uniform.uDataInput = $p.texture.tData;

    var gl = $p.ctx;
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
}
