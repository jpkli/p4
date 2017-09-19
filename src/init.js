define(function(require){
    const utils = require('./utils');

    return function(context, dataProps) {
        var data = dataProps || [];

        context.indexes = data.indexes || [];
        context.categoryIndex = data.CAMs || {};
        context.categoryLookup = data.TLBs || {};
        context.dkeys =  data.keys || [];
        context.dtypes =  data.dtypes || [];
        context.intervals =  data.intervals || {};
        context.cachedResult = [];
        context.pipeline = [];
        context.crossfilters = {};
        context.deriveCount = 0;
        context.resultDimension = [1, 1];
        context.dataSize = 0;

        var dkeys = context.dkeys,
            dtypes = context.dtypes,
            stats =  data.stats || null;

        if (data.hasOwnProperty("size"))
            context.dataSize = data.size;
        else
        if (Array.isArray(data))
            data.forEach(function(d) {
                context.dataSize += d.length;
            });

        //TODO: get data statistics using the GPU
        //if(stats === null) {}

        context.fields = context.indexes.concat(dkeys.filter(function(k) {
            return context.indexes.indexOf(k) === -1;
        }));
        context.fieldDomains = context.fields.map(function(k, i) {
            return [stats[k].min, stats[k].max];
        });
        context.fieldWidths = new Array(context.fields.length);
        context.fieldCount = context.fields.length - context.indexes.length;

        function getDataWidth(fid, range) {
            var range = Math.abs(range[1] - range[0]);

            if (dtypes[fid] == "index" || dtypes[fid] == "int" || dtypes[fid] == "string") {
                return range + 1;
            } else if (dtypes[fid] == "time") {
                var interval = stats[context.fields[fid]].min;
                if (interval === 0) interval = (data[fid][1] - data[fid][0]) || 1;
                context.intervals[dkeys[fid]] = {};
                context.intervals[dkeys[fid]].dtype = 'time';
                context.intervals[dkeys[fid]].interval = interval;
                context.intervals[dkeys[fid]].min = stats[dkeys[fid]].min;
                context.intervals[dkeys[fid]].max = stats[dkeys[fid]].max;
                return range / interval + 1;
            } else if (["nominal", "ordinal", "categorical"].indexOf(dtypes[fid]) > -1) {
                return data.TLB.length;
            } else if (dtypes[fid] in ["float", "double", "numeric"]) {
                return 10;
            } else {
                return range;
            }
        }

        context.fields.forEach(function(field) {
            var min = stats[field].min,
                max = stats[field].max,
                fi = dkeys.indexOf(field);

            context.fieldWidths[fi] = getDataWidth(fi, [min, max]);
        });


        context.getDataWidth = getDataWidth;

        context.dataDimension = [
            8192,
            Math.ceil(context.dataSize / 8192)
        ];

        context.deriveDomains = new Array(context.deriveMax).fill([0, 1]);
        context.deriveWidths = new Array(context.deriveMax).fill(1);
        context.deriveFieldCount = 0;


        if (context.indexes.length === 0) {
            context.attribute("aIndex0", "float", utils.seqFloat(0, context.dataDimension[0] - 1));
            context.attribute("aIndex1", "float", utils.seqFloat(0, context.dataDimension[1] - 1));
            context.attribute("aIndex0Value", "float", utils.seqFloat(0, context.dataDimension[0] - 1));
            context.attribute("aIndex1Value", "float", utils.seqFloat(0, context.dataDimension[1] - 1));
        } else {
            context.indexes.forEach(function(id, i) {
                var indexAttrData = arrays.unique(data[id]).sort(function(a, b) {
                    return a - b;
                });
                context.attribute("aIndex" + i + "Value", "float", new Float32Array(indexAttrData));
                context.attribute("aIndex" + i, "float", utils.seqFloat(0, indexAttrData.length - 1));
                context.fieldWidths[i] = indexAttrData.length;
                context.dataDimension[i] = indexAttrData.length;
            });
        }

        context.attribute("_vid", "float", utils.seqFloat(0, context.dataDimension[0] * context.dataDimension[1] - 1));
        context.attribute("_fid", "vec2", utils.seqFloat(0, context.fields.length * 2));
        context.attribute("_qid", "float", [0, 1, 2, 3, 4, 5]);
        context.ctx.ext.vertexAttribDivisorANGLE(context.attribute._qid.location, 0);
        context.ctx.ext.vertexAttribDivisorANGLE(context.attribute._fid.location, 0);
        context.ctx.ext.vertexAttribDivisorANGLE(context.attribute._vid.location, 1);

        context.attribute("_square", "vec2", new Float32Array([-1.0, -1.0,
            1.0, -1.0, -1.0, 1.0, -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]));

        //setup all attribute, uniform, texture, varying needed by all the shaders
        context
            .uniform("uDataDim", "vec2", context.dataDimension)
            .uniform("uResultDim", "vec2", context.dataDimension)
            .uniform("uIndexCount", "int", context.indexes.length)
            .uniform("uFieldDomains", "vec2", context.fieldDomains)
            .uniform("uFieldWidths", "float", context.fieldWidths)
            .uniform("uFieldCount", "int", context.fieldCount)
            .uniform("uFieldId", "int", 0)
            .uniform("uFilterFlag", "int", 0)
            .uniform("uGroupFields", "int", [0, -1])
            .uniform("uDataInput", "sampler2D")
            .uniform("uDeriveCount", "int", context.deriveMax)
            .uniform("uDeriveDomains", "vec2", context.deriveDomains)
            .uniform("uDeriveWidths", "float", context.deriveWidths);

        context
            .varying("vResult", "float")
            .texture(
                "tData",
                "float",
                new Float32Array(context.dataDimension[0] * context.dataDimension[1] * context.fieldCount), [context.dataDimension[0], context.dataDimension[1] * context.fieldCount],
                "alpha"
            )
            .framebuffer("fFilterResults", "unsigned_byte", context.dataDimension)
            .framebuffer("fGroupResults", "float", [1024, 1])
            .framebuffer("fDerivedValues", "float", [context.dataDimension[0], context.dataDimension[1] * context.deriveMax]);

        context.parameter({
            fieldCount: context.fields.length - context.indexes.length,
            indexCount: context.indexes.length
        });

        context.fields.slice(context.indexes.length).forEach(function(attr, ai) {
            var buf = new Float32Array(context.dataDimension[0] * context.dataDimension[1]);
            for (var i = 0, l = data[attr].length; i < l; i++) {
                buf[i] = data[attr][i];
            }
            context.texture.tData.update(
                buf, [0, context.dataDimension[1] * ai], context.dataDimension
            );
        });

        // context.texture.tData.sampler = context.uniform.uDataInput;
        context.uniform.uDataInput = context.texture.tData;

        function getFieldWidth($int_fid) {
            if (fid >= this.uFieldCount + this.uIndexCount) {
                return this.uDeriveWidths[fid - this.uFieldCount - this.uIndexCount];
            } else {
                return this.uFieldWidths[fid];
            }
        }

        function getFieldDomain($int_fid) {
            if (fid >= this.uFieldCount + this.uIndexCount) {
                return this.uDeriveDomains[fid - this.uFieldCount - this.uIndexCount];
            } else {
                return this.uFieldDomains[fid];
            }
        }

        function getData($int_fid, $float_r, $float_s) {
            var t, value;
            if (fid >= this.uFieldCount + this.uIndexCount) {
                t = (float(fid - this.uFieldCount - this.uIndexCount) + s) /
                    float(this.uDeriveCount);
                value = texture2D(this.fDerivedValues, vec2(r, t)).a;
            } else {
                if (this.uIndexCount > 0 && fid == 0) value = this.aIndex0Value;
                else if (this.uIndexCount > 1 && fid == 1) value = this.aIndex1Value;
                else {
                    t = (float(fid - this.uIndexCount) + s) / float(this.uFieldCount);
                    value = texture2D(this.uDataInput, vec2(r, t)).a;
                }
            }
            return value;
        }

        context
            .subroutine("getFieldWidth", "float", getFieldWidth)
            .subroutine("getFieldDomain", "vec2", getFieldDomain)
            .subroutine("getData", "float", getData);

        var gl = context.ctx;
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aIndex0.location, 0);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aIndex0Value.location, 0);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aIndex1.location, 1);
        gl.ext.vertexAttribDivisorANGLE(context.attribute.aIndex1Value.location, 1);

        context.getGroupKeyDimension = function getGroupKeyDimension(ids) {
            var dim = [1, 1];
            // console.log(context.deriveWidths, fieldCount, context.indexes.length);
            if (ids[0] !== -1) {
                dim[0] = (ids[0] < context.fieldCount + context.indexes.length) ?
                    context.fieldWidths[ids[0]] :
                    context.deriveWidths[ids[0] - context.fieldCount - context.indexes.length];
            }

            if (ids[1] !== -1)
                dim[1] = (ids[1] < context.fieldCount + context.indexes.length) ?
                context.fieldWidths[ids[1]] :
                context.deriveWidths[ids[1] - context.fieldCount - context.indexes.length];

            return dim;
        }

    }
})
