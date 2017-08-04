define(function(require) {
    var arrays = require('p4/core/arrays'),
        ctypes = require('./ctypes'),
        cstore = require('./cstore'),
        FlexGL = require('flexgl/flexgl'),
        compile = require('./compile');

    var optDerive = require('./derive');

    var kernelSources = [
        './aggregate',
        './filter',
        './derive',
        './cache',
        './stats',
        './visualize'
    ];

    var kernels = kernelSources.map(function(k){
        return require(k);
    });

    function seq(dtype, start, end, interval) {
        var step = interval || 1,
            size = (end - start) / step + 1,
            buf;

        buf = new ctypes[dtype](size);
        for (var i = 0; i < size; i++) {
            buf[i] = start + i * step;
        }
        return buf;
    }

    var seqInt = seq.bind(null, "int"),
        seqFloat = seq.bind(null, "float");

    return function ADAV(options) {
        var adav = {},
            container    = options.container || document.body,
            context      = options.context || null;

        var indexes     = options.indexes || [],
            data        = options.data || [],
            keys        = options.keys || data.keys || [],
            types       = options.types || data.types || [],
            intervals   = options.intervals || data.intervals || {},
            stats       = options.stats || data.stats || null,
            profiling   = options.profiling || false,
            dataSize    = 0;

        var config       = options.config || {},
            viewport     = config.viewport || [600, 600],
            padding      = config.padding || {
                left: 50,
                right: 10,
                top: 0,
                bottom: 30
            },
            deriveMax    = config.deriveMax || 2,
            deriveCount  = 0;


        var viewID = 0,
            viewNames = [],
            viewMappings = [],
            views = [
                {
                    width: viewport[0] - padding.left - padding.right,
                    height: viewport[1] - padding.top - padding.bottom,
                    offset: [0, 0]
                }
            ];

        adav.views = options.views || views;

        var categoryLookup = data.TLBs || {},
            categoryIndex = data.CAMs || {};

        var pipeline  = [],
            registers = {},
            profiles  = [],
            crossfilters = {};

        var rerun = false,
            optID = 0;

        function addToPipeline(opt, arg) {
            if(!rerun || !fxgl._update) {
                var spec = {};
                spec[opt] = arg;
                pipeline.push(spec);
                return optID++;
            } else {
                return -1;
            }
        }

        var fxgl;
        if (context === null) {
            fxgl = new FlexGL({
                container: container,
                width: viewport[0] - padding.left - padding.right,
                height: viewport[1] - padding.top - padding.bottom,
                padding: padding
            });
            fxgl.container = container;
            fxgl.padding = padding;
            fxgl.viewport = viewport;
        } else {
            fxgl = context;
        }

        fxgl.cachedResult = [];

        if (data.hasOwnProperty("size"))
            dataSize = data.size;
        else
        if (Array.isArray(data))
            data.forEach(function(d) {
                dataSize += d.length;
            });

        //TODO: get data statistics using the GPU
        //if(stats === null) {}

        var fields = indexes.concat(keys.filter(function(k) {
                return indexes.indexOf(k) === -1;
            })),
            fieldDomains = fields.map(function(k, i) {
                return [stats[k].min, stats[k].max];
            }),
            fieldWidths = new Array(fields.length),
            fieldCount = fields.length - indexes.length;

        function getDataWidth(fid, range) {
            var range = Math.abs(range[1] - range[0]);

            if (types[fid] == "index" || types[fid] == "int" || types[fid] == "string") {
                return range + 1;
            } else if (types[fid] == "time") {
                var interval = stats[fields[fid]].min;
                if (interval === 0) interval = (data[fid][1] - data[fid][0]) || 1;
                console.log('*******interval', interval, data[fid][1], data[fid][0]);
                intervals[keys[fid]] = interval;
                return range / interval + 1;
            } else if (["nominal", "ordinal", "categorical"].indexOf(types[fid]) > -1) {
                return data.TLB.length;
            } else if (types[fid] in ["float", "double", "numeric"]) {
                console.log(types[fid] , '***********************');
                return 10;
            } else {
                return range;
            }
        }

        fields.forEach(function(field) {
            var min = stats[field].min,
                max = stats[field].max,
                fi = keys.indexOf(field);

            fieldWidths[fi] = getDataWidth(fi, [min, max]);
        });

        var dataDimension = [];
        dataDimension[0] = 8192,
            dataDimension[1] = Math.ceil(dataSize / dataDimension[0]);

        var deriveDomains = new Array(deriveMax).fill([0, 1]),
            deriveWidths = new Array(deriveMax).fill(1),
            deriveFieldCount = 0;

        if (indexes.length === 0) {
            fxgl.attribute("aIndex0", "float", seqFloat(0, dataDimension[0] - 1));
            fxgl.attribute("aIndex1", "float", seqFloat(0, dataDimension[1] - 1));
            fxgl.attribute("aIndex0Value", "float", seqFloat(0, dataDimension[0] - 1));
            fxgl.attribute("aIndex1Value", "float", seqFloat(0, dataDimension[1] - 1));
        } else {
            indexes.forEach(function(id, i) {
                var indexAttrData = arrays.unique(data[id]).sort(function(a, b) {
                    return a - b;
                });
                fxgl.attribute("aIndex" + i + "Value", "float", new Float32Array(indexAttrData));
                fxgl.attribute("aIndex" + i, "float", seqFloat(0, indexAttrData.length - 1));
                fieldWidths[i] = indexAttrData.length;
                dataDimension[i] = indexAttrData.length;
            });
        }

        fxgl.attribute("_vid", "float", seqFloat(0, dataDimension[0] * dataDimension[1] - 1));
        fxgl.attribute("_fid", "vec2", seqFloat(0, fields.length * 2));
        fxgl.attribute("_qid", "float", [0,1,2,3,4,5]);
        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute._qid.location, 0);
        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute._fid.location, 0);
        fxgl.ctx.ext.vertexAttribDivisorANGLE(fxgl.attribute._vid.location, 1);

        fxgl.attribute("_square", "vec2",  new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0
            ]));

        //setup all attribute, uniform, texture, varying needed by all the shaders
        fxgl.uniform("uDataDim", "vec2", [dataDimension[0], dataDimension[1]])
            .uniform("uResultDim", "vec2", [dataDimension[0], dataDimension[1]])
            .uniform("uIndexCount", "int", indexes.length)
            .uniform("uFieldDomains", "vec2", fieldDomains)
            .uniform("uFieldWidths", "float", fieldWidths)
            .uniform("uFieldCount", "int", fieldCount)
            .uniform("uFieldId", "int", 0)
            .uniform("uFilterFlag", "int", 0)
            .uniform("uGroupFields", "int", [0, -1])
            .uniform("uDataInput", "sampler2D")
            .uniform("uDeriveCount", "int", deriveMax)
            .uniform("uDeriveDomains", "vec2", deriveDomains)
            .uniform("uDeriveWidths", "float", deriveWidths);

        fxgl.varying("vResult", "float")
            .texture("tData", "float", new Float32Array(dataDimension[0] * dataDimension[1] * fieldCount), [dataDimension[0], dataDimension[1] * fieldCount], "alpha")
            .framebuffer("fFilterResults", "unsigned_byte", dataDimension)
            .framebuffer("fGroupResults", "float", [1024, 1])
            .framebuffer("fDerivedValues", "float", [dataDimension[0], dataDimension[1] * deriveMax]);

        fxgl.parameter({
            fieldCount: fields.length - indexes.length,
            indexCount: indexes.length
        });

        fields.slice(indexes.length).forEach(function(attr, ai) {
            var buf = new Float32Array(dataDimension[0] * dataDimension[1]);
            for (var i = 0, l = data[attr].length; i < l; i++) {
                buf[i] = data[attr][i];
            }
            fxgl.texture.tData.update(
                buf, [0, dataDimension[1] * ai], [dataDimension[0], dataDimension[1]]
            );
        });

        // fxgl.texture.tData.sampler = fxgl.uniform.uDataInput;
        fxgl.uniform.uDataInput = fxgl.texture.tData;

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

        fxgl.subroutine("getFieldWidth", "float", getFieldWidth)
            .subroutine("getFieldDomain", "vec2", getFieldDomain)
            .subroutine("getData", "float", getData);

        // var cache = optCache(fxgl),
        //     group = optGroup(fxgl, fields, indexes),
        //     filter = optFilter(fxgl, fields),
        //     optStats = opStats(fxgl),
        //     visualize = visualization(fxgl);

        var opt = compile(fxgl, fields, {});

        var gl = fxgl.ctx;
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex0Value.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1.location, 1);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1Value.location, 1);

        function clearAndConfigBlend(equation, src, dest) {
            var equation = equation || gl.FUNC_ADD,
                src = src || gl.ONE,
                dest = dest || gl.ONE;

            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.BLEND);
            gl.blendFunc(src, dest);
            gl.blendEquation(equation);
        }

        function getGroupKeyDimension(ids) {
            var dim = [1, 1];
            // console.log(deriveWidths, fieldCount, indexes.length);
            if (ids[0] !== -1) {

                dim[0] = (ids[0] < fieldCount + indexes.length) ?
                    fieldWidths[ids[0]] :
                    deriveWidths[ids[0] - fieldCount - indexes.length];
            }

            if (ids[1] !== -1)
                dim[1] = (ids[1] < fieldCount + indexes.length) ?
                fieldWidths[ids[1]] :
                deriveWidths[ids[1] - fieldCount - indexes.length];

            return dim;
        }

        var getResult = function() {};

        adav.register = function(tag) {
            registers[tag] = {
                indexes: indexes,
                fields: fields,
                dataDim: fxgl.uniform.uDataDim.data.slice(),
                fieldWidths: fieldWidths,
                fieldDomains: fieldDomains,
                deriveCount: deriveCount,
                deriveWidths: deriveWidths,
                deriveDomains: deriveDomains,
                filterFlag: fxgl.uniform.uFilterFlag.data,
                filterControls: fxgl.uniform.uFilterControls.data.slice(),
                dataInput: fxgl.uniform.uDataInput.data,
                attribute: [{
                        id: fxgl.attribute.aIndex0.data,
                        value: fxgl.attribute.aIndex0Value.data
                    },
                    {
                        id: fxgl.attribute.aIndex1.data,
                        value: fxgl.attribute.aIndex1Value.data
                    },
                ]
            }
            console.log("registered ", tag, registers);
            return adav;
        }


        adav.resume = function(tag) {
            addToPipeline('resume', tag);
            if (!registers.hasOwnProperty(tag))
                throw new Error('"' + tag + '" is not found in regesters.');

            var reg = registers[tag];
            indexes = reg.indexes;
            deriveCount = reg.deriveCount;
            fieldCount = reg.fields.length - indexes.length - deriveCount;
            fxgl.uniform.uDataDim.data = reg.dataDim;
            fxgl.uniform.uIndexCount.data = reg.indexes.length;
            fxgl.uniform.uFieldCount.data = fieldCount;
            fxgl.uniform.uFieldDomains.data = reg.fieldDomains;
            fxgl.uniform.uFieldWidths.data = reg.fieldWidths;
            fxgl.uniform.uDeriveDomains.data = reg.deriveDomains;
            fxgl.uniform.uDeriveWidths.data = reg.deriveWidths;
            fxgl.uniform.uFilterFlag.data = reg.filterFlag;
            // fxgl.uniform.uFilterControls.data = reg.filterControls;
            fxgl.uniform.uDataInput.data = reg.dataInput;
            fields = reg.fields;
            fieldWidths = reg.fieldWidths;
            fieldDomains = reg.fieldDomains;
            deriveDomains = reg.deriveDomains;
            deriveWidths = reg.deriveWidths;
            dataDimension = reg.dataDim;

            fxgl.attribute['aIndex0'] = reg.attribute[0].id;
            fxgl.attribute['aIndex1'] = reg.attribute[1].id;

            fxgl.attribute['aIndex0Value'] = reg.attribute[0].value;
            fxgl.attribute['aIndex1Value'] = reg.attribute[1].value;

            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex0'].location, 0);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex1'].location, 1);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex0Value'].location, 0);
            gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex1Value'].location, 1);


            return adav;
        }

        adav.aggregate = function(spec) {
            addToPipeline('aggregate', spec);
            if(Object.keys(crossfilters).length)
                fxgl.uniform.uFilterFlag = 1;
            var groupFields = spec.$by || spec.$group,
                groupFieldIds = [-1, -1],
                resultDimension = [1, 1];

            if (Array.isArray(groupFields)) {
                groupFieldIds[0] = fields.indexOf(groupFields[0]);
                groupFieldIds[1] = fields.indexOf(groupFields[1]);
            } else {
                groupFieldIds[0] = fields.indexOf(groupFields);
            }

            resultDimension = getGroupKeyDimension(groupFieldIds);
            console.log(intervals, fieldWidths, resultDimension);
            // var resultFields = Object.keys(spec).filter(function(d){return d!='$by' && d!='$group';}),
            //     resultFieldIds = resultFields.map(function(f) { return fields.indexOf(f); }),
            //     operators = resultFields.map(function(r){return spec[r]; });

            var newFieldNames = Object.keys(spec).filter(function(d) {
                    return d != '$by' && d != '$group';
                }),
                resultFields = newFieldNames.map(function(f) {
                    return spec[f][Object.keys(spec[f])[0]];
                }),
                resultFieldIds = resultFields.map(function(f) {
                    return fields.indexOf(f);
                }),
                operators = resultFields.map(function(f, i) {
                    return Object.keys(spec[newFieldNames[i]])[0];
                });

            fxgl.framebuffer(
                "fGroupResults",
                "float", [resultDimension[0], resultDimension[1] * resultFields.length]
            );

            opt.aggregate.execute(operators, groupFieldIds, resultFieldIds, dataDimension, resultDimension);
            fxgl.ctx.finish();

            getResult = opt.aggregate.result;

            // console.log(getResult());
            //
            // indexes = groupFields;
            if (!Array.isArray(groupFields)) groupFields = [groupFields];
            indexes = groupFields;
            //
            dataDimension = resultDimension;
            //
            newFieldIds = groupFieldIds.filter(function(f) {
                return f !== -1
            }).concat(resultFieldIds);
            fields = groupFields.concat(newFieldNames);
            fxgl.uniform.uDataDim.data = resultDimension;
            fxgl.uniform.uIndexCount.data = indexes.length;
            fxgl.uniform.uFieldCount.data = fields.length - indexes.length;

            fieldWidths = fieldWidths.concat(deriveWidths);
            fieldDomains = fieldDomains.concat(deriveDomains);

            fieldDomains = newFieldIds.map(function(f) {
                return fieldDomains[f];
            });
            fieldWidths = newFieldIds.map(function(f) {
                return fieldWidths[f];
            });
            fxgl.uniform.uDataInput.data = fxgl.framebuffer.fGroupResults.texture;

            // if(groupFields.length == 1) {
            //     fxgl.cachedResult = adav.result('row');
            //     console.log(fxgl.cachedResult);
            // }
            resultDomains = opt.stats(resultFieldIds, dataDimension);
            gl.finish();
            // console.log("stats time:", new Date() - statStart);
            for (var ii = indexes.length; ii < indexes.length + resultFieldIds.length; ii++) {
                fieldDomains[ii] = resultDomains[ii - indexes.length];
                fieldWidths[ii] = resultDomains[ii - indexes.length][1] - resultDomains[ii - indexes.length][0];
            }
            // console.log( resultFieldIds, fieldWidths, fieldDomains, fields, indexes, resultDimension);

            // fxgl.attribute._vid = seqFloat(0, resultDimension[0] * resultDimension[1] - 1);
            // fxgl.attribute._fid = seqFloat(0, fields.length);

            fxgl.uniform.uFieldDomains.data = fieldDomains;
            fxgl.uniform.uFieldWidths.data = fieldWidths;
            fxgl.uniform.uFilterFlag.data = 0;


            // adav.cache('cacheResult');
            // fxgl.uniform.uDataInput.data = fxgl.framebuffer.cacheResult.texture;
            // fxgl.framebuffer.enableRead('cacheResult');


            // fxgl.ctx.finish();
            // console.log('pregroup time', new Date() - start);
            indexes.forEach(function(d, i) {
                fxgl.attribute['aIndex' + i] = seqFloat(0, resultDimension[i] - 1);
                var interval = intervals[d] || 1;

                fxgl.attribute['aIndex' + i + 'Value'] = seqFloat(fieldDomains[i][0], fieldDomains[i][1], interval);

                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex' + i].location, i);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute['aIndex' + i + 'Value'].location, i);
            });

            if (indexes.length == 1) {
                fxgl.attribute.aIndex1 = seqFloat(0, 1);
                fxgl.attribute.aIndex1Value = seqFloat(0, 1);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1.location, 1);
                gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aIndex1Value.location, 1);
            }

            return adav;
        }

        adav.filter = function(spec) {
            addToPipeline('filter', spec);

            var filterSpec = spec;
            Object.keys(crossfilters).forEach(function(c){
                filterSpec[c] = crossfilters[c];
            });

            Object.keys(filterSpec).forEach(function(k, i) {
                var fid = fields.indexOf(k);
                if(categoryIndex.hasOwnProperty(k)) {
                    var min, max, values;
                    values = spec[k].map(function(v) { return categoryIndex[k][v]; });
                    min = arrays.min(values);
                    max = arrays.max(values);
                    spec[k] = [min, max];
                }
            });

            fxgl.uniform.uFilterFlag = 1;

            var newDomains = opt.filter.execute(spec, fields);
            getResult = opt.filter.result;

            if(!fxgl._update){
                Object.keys(spec).forEach(function(k, i) {
                    var fid = fields.indexOf(k);
                    if (fid === -1) throw new Error('Invalid data field ' + k);
                    var range = [];
                    if(spec[k].hasOwnProperty('$in')) {
                        range[0] = Math.min.apply(null, spec[k].$in);
                        range[1] = Math.max.apply(null, spec[k].$in);
                    } else {
                        range = spec[k];
                    }
                    if (fid < fieldCount + indexes.length) {
                        fieldDomains[fid] = range;
                        fieldWidths[fid] = getDataWidth(keys.indexOf(k), range);
                    } else {
                        var di = fid - fieldCount - indexes.length;
                        deriveDomains[di] = range;
                        deriveWidths[di] = range[1] - range[0] + 1;
                    }
                });
                fxgl.uniform.uFieldDomains.data = fieldDomains;
                fxgl.uniform.uFieldWidths.data = fieldWidths;
                fxgl.uniform.uDeriveDomains.data = deriveDomains;
                fxgl.uniform.uDeriveWidths.data = deriveWidths;
            }

            return adav;
        }

        adav.derive = function(spec) {
            addToPipeline('derive', spec);
            var derive,
                deriveFields = Object.keys(spec);

            if (opt.hasOwnProperty('derive'))
                derive = opt.derive;
            else
                derive = optDerive(fxgl, fields, spec);

            fields = fields.concat(deriveFields);

            var newDomains = derive.execute();
            newDomains.forEach(function(d, i) {
                deriveDomains[i] = d;
                deriveWidths[i] = d[1] - d[0] + 1;
            });
            deriveCount += deriveFields.length;
            // console.log(derive.result());
            getResult = derive.result;
            // console.log(deriveDomains, fields);

            fxgl.uniform.uDeriveDomains.data = deriveDomains;
            fxgl.uniform.uDeriveWidths.data = deriveWidths;

            return adav;
        }

        adav.cache = function(tag) {
            opt.cache.execute(tag);
            // console.log(cache.result());
            return adav;
        }


        adav.visualize = function(vmap) {
            var optID = addToPipeline('visualize', vmap);
            var viewDim = viewDim || fxgl.viewport;
            var filters = {};

            if(typeof vmap.id == 'string') {
                var viewIndex = viewNames.indexOf(vmap.id);
                if( viewIndex == -1) {
                    viewNames.push(vmap.id);
                    vmap.id = viewNames.length - 1;
                } else {
                    vmap.id = viewIndex;
                }
            }

            var viewOptions = {
                vmap: vmap,
                fields: fields,
                domains: fieldDomains,
                dataDim: dataDimension,
                categories: categoryLookup,
                viewOrder: vmap.id,
                width: adav.views[vmap.id].width,
                height: adav.views[vmap.id].height,
                offset: adav.views[vmap.id].offset
            };

            if(!rerun) {
                if(vmap.hasOwnProperty('interact')) {
                    viewOptions.interaction = function(d) {
                        // console.log(d);
                        fxgl._update = true;
                        rerun = true;
                        // adav.head();
                        vmap.interact(d);
                        rerun = false;
                    }
                }  else {
                    viewOptions.interaction = function(d) {

                        fxgl._update = true;
                        rerun = true;
                        Object.keys(d).forEach(function(k) {
                            crossfilters[k] = d[k];
                        });
                        adav.update();
                        // var operations = pipeline.slice(0, optID);
                        // var filtering = false;
                        // for (var i = 0, l = pipeline.length; i < l; i++) {
                        //     var p = pipeline[i];
                        //     if(Object.keys(p)[0] == 'filter') {
                        //         Object.keys(d).forEach(function(k) {
                        //             p.filter[k] = d[k];
                        //         });
                        //         filtering = true;
                        //         break;
                        //     }
                        // }

                        adav.run();
                        // Object.keys(d).forEach(function(k) {
                        //     delete crossfilters[k];
                        // });
                        rerun = false;
                        // adav.run(operations.concat(pipeline.slice(optID)));
                        // adav.run([{filter: filters}].concat(pipeline));

                        // console.log('**interactive latency:', performance.now() - start);
                    };
                }
                viewID++;

            }


            opt.visualize(viewOptions);

            return adav;
        }

        adav.clear = function() {
            console.log(fxgl.visLayers);
        }

        adav.read = function() {
            console.log("Read>>", getResult());
            return adav;
        }

        adav.result = function(format) {
            var buf = getResult(),
                res = {},
                offset = 0;

            var rs = 0;

            if (resultDimension[0] > 1) {
                res[fields[rs]] = fxgl.attribute.aIndex0Value.data;
                rs++;
            }

            if (resultDimension[1] > 1) {
                bx = fxgl.attribute.aIndex0Value.data;
                by = fxgl.attribute.aIndex1Value.data;
                var ax = new Array(resultDimension[0] * resultDimension[1]),
                    ay = new Array(resultDimension[0] * resultDimension[1]);

                for (var y = 0; y < resultDimension[1]; y++) {
                    for (var x = 0; x < resultDimension[0]; x++) {

                        ax[y * resultDimension[0] + x] = bx[x];
                        ay[y * resultDimension[0] + x] = by[y]
                    }
                }
                res[fields[0]] = ax;
                res[fields[rs]] = ay;
                rs++;
            }

            var arraySize = resultDimension[0] * resultDimension[1];

            for (var i = rs; i < fields.length; i++) {
                res[fields[i]] = buf.subarray(offset, offset + arraySize);
                offset += arraySize;
            };

            if (format == 'row') {
                var objectArray = new Array(arraySize);

                for (var i = 0; i < arraySize; i++) {
                    var obj = {};
                    Object.keys(res).forEach(function(f) {
                        var kid = keys.indexOf(f),
                            dtype = types[kid];

                        if (dtype == 'string' && categoryLookup.hasOwnProperty(f)) {
                            obj[f] = categoryLookup[f][res[f][i] - 1];
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

        var branchID = 0;;
        adav.branch = function(branches) {
            adav.register('_branch'+branchID);

            branches.forEach(function(b){
                var operations = Object.keys(b).map(function(o) {
                    var obj = {};
                    obj[o] = b[o];
                    return obj;
                });
                adav.run(operations);
                adav.resume('_branch' + branchID);
            })

            branchID++;
        }

        adav.output = function(callback) {
            addToPipeline('output', callback);
            callback(adav.result('row'));
            return adav;
        }

        adav.pipeline = function() {
            console.log(pipeline);
        }

        adav.run = function(opts) {
            var operations = opts || pipeline;
            operations.forEach(function(p, i){
                var opt = Object.keys(p)[0];
                adav[opt](p[opt]);
            })
            fxgl._update = false;
            return adav;
        }

        fxgl.readResult = adav.result;
        adav.ctx = fxgl.ctx;
        adav.register('__init__');
        adav.head = adav.resume.bind(null, '__init__');

        adav.update = function() {
            fxgl._update = true;
            adav.resume('__init__');
            adav.filter(crossfilters);

            return adav;
        }
        return adav;
    }
});
