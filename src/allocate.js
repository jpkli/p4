define(function(require){
    const utils = require('./utils');
    const vecId = ['x', 'y', 'z'];
    return function($p, dataProps) {
        var data = dataProps || [];

        $p.indexes = data.indexes || [];
        $p.categoryIndex = data.CAMs || {};
        $p.categoryLookup = data.TLBs || {};
        $p.dkeys =  data.keys || [];
        $p.dtypes =  data.dtypes || data.types || [];
        $p.intervals =  data.intervals || {};
        $p.cachedResult = [];
        $p.pipeline = [];
        $p.crossfilters = {};
        $p.deriveCount = 0;
        $p.resultDimension = [1, 1];
        $p.dataSize = 0;

        var dkeys = $p.dkeys,
            dtypes = $p.dtypes,
            stats =  data.stats || null;

        if (data.hasOwnProperty("size"))
            $p.dataSize = data.size;
        else if (Array.isArray(data))
            $p.dataSize = Math.max.apply(null, data.map(function(d) {
                return d.length;
            }));

        var rowSize = Math.min($p.dataSize, 8192),
            colSize = Math.ceil($p.dataSize / rowSize);

        $p.dataDimension = [rowSize, colSize];

        $p.fields = $p.indexes.concat(dkeys.filter(function(k) {
            return $p.indexes.indexOf(k) === -1;
        }));
        $p.fieldWidths = new Array($p.fields.length).concat(new Array($p.deriveMax).fill(1));
        $p.fieldCount = $p.fields.length - $p.indexes.length;


        function getDataWidth(fid, range) {
            var range = Math.abs(range[1] - range[0]);
            if (dtypes[fid] == "index" || dtypes[fid] == "int" || dtypes[fid] == "string") {
                return range + 1;
            } else if (dtypes[fid] == "time") {
                var interval = stats[$p.fields[fid]].min;
                if (interval === 0) interval = (data[fid][1] - data[fid][0]) || 1;
                $p.intervals[dkeys[fid]] = {};
                $p.intervals[dkeys[fid]].dtype = 'time';
                $p.intervals[dkeys[fid]].interval = interval;
                $p.intervals[dkeys[fid]].min = stats[dkeys[fid]].min;
                $p.intervals[dkeys[fid]].max = stats[dkeys[fid]].max;
                return range / interval + 1;
            } else if (["nominal", "ordinal", "categorical"].indexOf(dtypes[fid]) > -1) {
                return data.TLB.length;
            } else if (dtypes[fid] in ["float", "double", "numeric"]) {
                return 10;
            } else {
                return range+1;
            }
        }
        $p.fields.forEach(function(field) {
            var min = stats[field].min,
                max = stats[field].max,
                fi = dkeys.indexOf(field);
            console.log(fi, [min, max]);
            $p.fieldWidths[fi] = getDataWidth(fi, [min, max]);
        });
        $p.getDataWidth = getDataWidth;
        console.log($p.dataDimension, $p.dataSize);
        $p.deriveDomains = new Array($p.deriveMax).fill([0, 1]);
        $p.deriveWidths = new Array($p.deriveMax).fill(1);
        $p.deriveFieldCount = 0;

        if ($p.indexes.length === 0) {
            $p.attribute("aDataIdx", "float", utils.seqFloat(0, $p.dataDimension[0] - 1));
            $p.attribute("aDataIdy", "float", utils.seqFloat(0, $p.dataDimension[1] - 1));
            $p.attribute("aDataValx", "float", utils.seqFloat(0, $p.dataDimension[0] - 1));
            $p.attribute("aDataValy", "float", utils.seqFloat(0, $p.dataDimension[1] - 1));
        } else {

            $p.indexes.forEach(function(id, i) {
                var indexAttrData = arrays.unique(data[id]).sort(function(a, b) {
                    return a - b;
                });
                $p.attribute("aDataVal" + vecId[i], "float", new Float32Array(indexAttrData));
                $p.attribute("aDataId" + vecId[i], "float", utils.seqFloat(0, indexAttrData.length - 1));
                $p.fieldWidths[i] = indexAttrData.length;
                $p.dataDimension[i] = indexAttrData.length;
            });
        }

        $p.attribute("aDataItemVal0", "float", null);
        $p.attribute("aDataItemVal1", "float", null);
        $p.attribute("aDataItemId", "float", new Float32Array($p.dataSize).map((d,i)=>i));
        $p.attribute("aDataFieldId", "vec2", new Float32Array($p.fields.length * 2).map((d,i)=>i));
        $p.attribute("aVertexId", "float", [0, 1, 2, 3, 4, 5]);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);

        $p.attribute("_square", "vec2", new Float32Array([-1.0, -1.0,
            1.0, -1.0, -1.0, 1.0, -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]));

        //setup all attribute, uniform, texture, varying needed by all the shaders
        $p.uniform("uDataSize", "float", $p.dataSize);
        $p.uniform("uDataDim", "vec2", $p.dataDimension);
        $p.uniform("uResultDim", "vec2", $p.dataDimension);
        $p.uniform("uIndexCount", "int", $p.indexes.length);
        $p.uniform("uFieldWidths", "float", $p.fieldWidths);
        $p.uniform("uFieldCount", "int", $p.fieldCount);
        $p.uniform("uFieldId", "int", 0);
        $p.uniform("uFilterFlag", "int", 0);
        $p.uniform("uGroupFields", "int", [0, -1]);
        $p.uniform("uDataInput", "sampler2D");
        $p.uniform("uDeriveCount", "int", $p.deriveMax);
        // $p.uniform("uDeriveDomains", "vec2", $p.deriveDomains);
        // $p.uniform("uDeriveWidths", "float", $p.deriveWidths);

        $p.varying("vResult", "float");
        $p.varying("vDiscardData", "float");
        $p.texture(
            "tData",
            "float",
            new Float32Array($p.dataDimension[0] * $p.dataDimension[1] * $p.fieldCount), [$p.dataDimension[0], $p.dataDimension[1] * $p.fieldCount],
            "alpha"
        );
        $p.framebuffer("fFilterResults", "unsigned_byte", $p.dataDimension);
        $p.framebuffer("fGroupResults", "float", [1024, 1]);
        $p.framebuffer("fDerivedValues", "float", [$p.dataDimension[0], $p.dataDimension[1] * $p.deriveMax]);

        $p.parameter({
            fieldCount: $p.fields.length - $p.indexes.length,
            indexCount: $p.indexes.length
        });

        $p.fields.slice($p.indexes.length).forEach(function(attr, ai) {
            var buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
            for (var i = 0, l = data[attr].length; i < l; i++) {
                buf[i] = data[attr][i];
            }
            $p.texture.tData.update(
                buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
            );
        });

        //TODO: get data statistics using the GPU
        if(stats !== null) {
            $p.fieldDomains = $p.fields.map(function(k, i) {
                return [stats[k].min, stats[k].max];
            })
            .concat(new Array($p.deriveMax).fill([0, 1]));

            $p.uniform("uFieldDomains", "vec2",  $p.fieldDomains);

        } else {
            $p.uniform("uFieldDomains", "vec2",  $p.fields.map(f => [0, 1]));
        }


        // $p.texture.tData.sampler = $p.uniform.uDataInput;
        $p.uniform.uDataInput = $p.texture.tData;

        function getFieldWidth($int_fid) {

            return this.uFieldWidths[fid];
        }

        function getFieldDomain($int_fid) {

            return this.uFieldDomains[fid];

        }

        function getData($int_fid, $float_r, $float_s) {
            var t, value;
            if (fid >= this.uFieldCount + this.uIndexCount) {
                t = (float(fid - this.uFieldCount - this.uIndexCount) + s) /
                    float(this.uDeriveCount);
                value = texture2D(this.fDerivedValues, vec2(r, t)).a;
            } else {
                if (this.uIndexCount > 0 && fid == 0) value = this.aDataValx;
                else if (this.uIndexCount > 1 && fid == 1) value = this.aDataValy;
                else {
                    t = (float(fid - this.uIndexCount) + s) / float(this.uFieldCount);
                    value = texture2D(this.uDataInput, vec2(r, t)).a;
                }
            }
            return value;
        }

        function getNonIndexedData($int_fieldId, $float_addrX, $float_addrY) {
            var offsetY, value;
            if (fieldId >= this.uFieldCount + this.uIndexCount) {
                offsetY = (float(fieldId - this.uFieldCount - this.uIndexCount) + addrY) /
                    float(this.uDeriveCount);
                value = texture2D(this.fDerivedValues, vec2(addrX, offsetY)).a;
            } else {
                offsetY = (float(fieldId - this.uIndexCount) + addrY) / float(this.uFieldCount);
                value = texture2D(this.uDataInput, vec2(addrX, offsetY)).a;
            }
            return value;
        }

        $p.subroutine("getFieldWidth", "float", getFieldWidth);
        $p.subroutine("getFieldDomain", "vec2", getFieldDomain);
        $p.subroutine("getData", "float", getData);
        $p.subroutine("getNonIndexedData", "float", getNonIndexedData);

        var gl = $p.ctx;
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

    }
})
