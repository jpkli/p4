define(function(require) {

    var arrays = require('p4/core/arrays'),
        packData = require('./pack'),
        output = require('./output'),
        utils = require('./utils'),
        config = require('./config'),
        cstore = require('./cstore'),
        compile = require('./compile');

    var optDerive = require('./derive');

    return function pipeline(options) {
        var pipeline = {};

        var $p = config(options);

        var registers = {},
            profiles  = [];

        var rerun = false,
            opt = {},
            optID = 0;

        function addToPipeline(opt, arg) {
            if(!rerun || !$p._update) {
                var spec = {};
                spec[opt] = arg;
                $p.pipeline.push(spec);
                return optID++;
            } else {
                return -1;
            }
        }

        pipeline.data = function(dataOptions) {
            packData($p, dataOptions);
            opt = compile($p);
            // if(!$p.hasOwnProperty('fieldDomains')) {
                var dd = opt.extent($p.fields.map((f, i) => i), $p.dataDimension);
                // console.log(dd);
                // $p.uniform.uFieldDomains.data = $p.fieldDomains;
            // }
            $p.opt = opt;
            pipeline.ctx = $p.ctx;
            pipeline.register('__init__');

            return pipeline;
        }

        $p.getResult = function() {};

        pipeline.register = function(tag) {
            registers[tag] = {
                indexes: $p.indexes,
                fields: $p.fields,
                dataDim: $p.uniform.uDataDim.data.slice(),
                fieldWidths: $p.fieldWidths,
                fieldDomains: $p.fieldDomains,
                deriveCount: $p.deriveCount,
                deriveWidths: $p.deriveWidths,
                deriveDomains: $p.deriveDomains,
                filterFlag: $p.uniform.uFilterFlag.data,
                filterControls: $p.uniform.uFilterControls.data.slice(),
                dataInput: $p.uniform.uDataInput.data,
                attribute: [{
                        id: $p.attribute.aIndex0.data,
                        value: $p.attribute.aIndex0Value.data
                    },
                    {
                        id: $p.attribute.aIndex1.data,
                        value: $p.attribute.aIndex1Value.data
                    },
                ]
            }
            // console.log("registered ", tag, registers);
            return pipeline;
        }

        pipeline.resume = function(tag) {
            addToPipeline('resume', tag);
            if (!registers.hasOwnProperty(tag))
                throw new Error('"' + tag + '" is not found in regesters.');

            var reg = registers[tag];
            //resume CPU registers
            $p.indexes = reg.indexes;
            $p.deriveCount = reg.deriveCount;
            $p.fieldCount = reg.fields.length - reg.indexes.length - reg.deriveCount;
            $p.fields = reg.fields;
            $p.fieldWidths = reg.fieldWidths;
            $p.fieldDomains = reg.fieldDomains;
            $p.deriveDomains = reg.deriveDomains;
            $p.deriveWidths = reg.deriveWidths;
            $p.dataDimension = reg.dataDim;

            //resume GPU Uniforms
            $p.uniform.uFieldCount.data = $p.fieldCount;
            $p.uniform.uDataDim.data = reg.dataDim;
            $p.uniform.uIndexCount.data = reg.indexes.length;
            $p.uniform.uFieldDomains.data = reg.fieldDomains;
            $p.uniform.uFieldWidths.data = reg.fieldWidths;
            $p.uniform.uDeriveDomains.data = reg.deriveDomains;
            $p.uniform.uDeriveWidths.data = reg.deriveWidths;
            $p.uniform.uFilterFlag.data = reg.filterFlag;
            // $p.uniform.uFilterControls.data = reg.filterControls;
            $p.uniform.uDataInput.data = reg.dataInput;

            //resume GPU Attribute Buffers
            $p.attribute['aIndex0'] = reg.attribute[0].id;
            $p.attribute['aIndex1'] = reg.attribute[1].id;
            $p.attribute['aIndex0Value'] = reg.attribute[0].value;
            $p.attribute['aIndex1Value'] = reg.attribute[1].value;
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aIndex0'].location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aIndex1'].location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aIndex0Value'].location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aIndex1Value'].location, 1);

            return pipeline;
        }

        function binnedAggregation(spec) {
            var deriveSpec = {},
                binAttr,
                binCount;

            if (typeof spec.$bin == 'object') {
                binAttr = Object.keys(spec.$bin)[0];
                binCount = spec.$bin[binAttr];
            } else {
                binAttr = spec.$bin;
                //Apply Sturges' formula for determining the number of bins
                binCount = Math.ceil(Math.log2($p.dataSize)) + 1;
            }

            var binDomain = $p.fieldDomains[$p.fields.indexOf(binAttr)];
            var binInterval = (binDomain[1] - binDomain[0]) / binCount;

            var histFunction = (function() {max(ceil((binAttr - binMin) / float(binInterval)), 1.0)})
                .toString()
                .slice(13, -1) // remove "function () {" from function.toString
                .replace('binAttr', binAttr)
                .replace('binMin', binDomain[0] + '.0')
                .replace('binInterval', binInterval)

            deriveSpec['bin@'+binAttr] = histFunction;
            $p.intervals[binAttr] = {};
            $p.intervals[binAttr].dtype = 'historgram';
            $p.intervals[binAttr].interval = binInterval;
            $p.intervals[binAttr].min = binDomain[0];
            $p.intervals[binAttr].max = binDomain[1];
            $p.intervals[binAttr].align = 'right';
            pipeline.derive(deriveSpec);
            // var deriveFields = $p.fields.slice(-$p.deriveCount),
            //     dfid = deriveFields.indexOf('bin@'+binAttr);
            // $p.deriveDomains[dfid] = [stats[binAttr].min, stats[binAttr].max];
            return 'bin@'+binAttr;
        }

        pipeline.aggregate = function(spec) {
            if(spec.$bin) {
                spec.$group = binnedAggregation(spec);
                delete spec.$bin;
            }

            addToPipeline('aggregate', spec);
            if(Object.keys($p.crossfilters).length)
                $p.uniform.uFilterFlag = 1;

            opt.aggregate.execute(spec);

            return pipeline;
        }

        pipeline.filter = function(spec) {
            addToPipeline('filter', spec);

            opt.select.execute(spec);
            $p.getResult = opt.select.result;
            // console.log($p.getResult());
            return pipeline;
        }

        pipeline.select = pipeline.filter;

        pipeline.derive = function(spec) {
            addToPipeline('derive', spec);

            //TODO: recompile the kernel for derive by checking if deriving equations/functions changed.
            if (!opt.hasOwnProperty('derive')) {
                opt.derive = optDerive($p, spec);
            }
            opt.derive.execute(spec);
            $p.getResult = opt.derive.result;
            return pipeline;
        }

        pipeline.cache = function(tag) {
            opt.cache.execute(tag);
            // console.log(cache.result());
            return pipeline;
        }

        pipeline.visualize = function(vmap) {
            var optID = addToPipeline('visualize', vmap);
            var viewDim = viewDim || $p.viewport;

            var filters = {};
            if(typeof vmap.id == 'string') {
                var viewIndex = $p.viewNames.indexOf(vmap.id);
                if( viewIndex == -1) {
                    $p.viewNames.push(vmap.id);
                    vmap.id = $p.viewNames.length - 1;
                } else {
                    vmap.id = viewIndex;
                }
            }

            var viewOptions = {
                vmap: vmap,
                fields: $p.fields,
                domains: $p.fieldDomains,
                dataDim: $p.dataDimension,
                categories: $p.categoryLookup,
                intervals: $p.intervals,
                viewOrder: vmap.id,
                width: $p.views[vmap.id].width,
                height: $p.views[vmap.id].height,
                offset: $p.views[vmap.id].offset
            };

            if(!rerun) {
                if(vmap.hasOwnProperty('interact')) {
                    viewOptions.interaction = function(d) {
                        // console.log(d);
                        $p._update = true;
                        rerun = true;
                        // pipeline.head();
                        vmap.interact(d);
                        rerun = false;
                    }
                }
                else if($p.interaction == 'auto') {
                    viewOptions.interaction = function(d) {

                        $p._update = true;
                        rerun = true;
                        Object.keys(d).forEach(function(k) {
                            if(d[k].length < 2) {
                                if($p.intervals.hasOwnProperty(k)) {
                                    var value = (Array.isArray(d[k])) ? d[k][0] : d[k];
                                    d[k] = [value-$p.intervals[k].interval, value];
                                }
                            }
                            $p.crossfilters[k] = d[k];
                        });
                        pipeline.update();
                        // console.log('$p.crossfilters::::::', $p.crossfilters, $p.fieldDomains);

                        var operations = $p.pipeline.slice(0, optID);
                        var filtering = false;
                        for (var i = 0, l = $p.pipeline.length; i < l; i++) {
                            var p = $p.pipeline[i];
                            if(Object.keys(p)[0] == 'filter') {
                                Object.keys(d).forEach(function(k) {
                                    p.filter[k] = d[k];
                                });
                                filtering = true;
                                break;
                            }
                        }

                        pipeline.run();
                        // Object.keys(d).forEach(function(k) {
                        //     delete $p.crossfilters[k];
                        // });
                        rerun = false;
                        // pipeline.run(operations.concat($p.pipeline.slice(optID)));
                        // pipeline.run([{filter: filters}].concat($p.pipeline));

                        // console.log('**interactive latency:', performance.now() - start);
                    };
                }
                $p.viewID++;

            }

            opt.visualize(viewOptions);

            return pipeline;
        }

        pipeline.clear = function() {
            console.log($p.visLayers);
        }

        pipeline.read = function() {
            console.log("Read>>", $p.getResult());
            return pipeline;
        }

        pipeline.result = output($p);

        pipeline.output = function(callback) {
            addToPipeline('output', callback);
            callback(pipeline.result('row'));
            return pipeline;
        }

        var branchID = 0;;
        pipeline.branch = function(branches) {
            pipeline.register('_branch'+branchID);

            branches.forEach(function(b){
                var operations = Object.keys(b).map(function(o) {
                    var obj = {};
                    obj[o] = b[o];
                    return obj;
                });
                pipeline.run(operations);
                pipeline.resume('_branch' + branchID);
            })

            branchID++;
        }

        pipeline.pipeline = function() {
            console.log($p.pipeline);
        }

        pipeline.run = function(opts) {
            var operations = opts || $p.pipeline;
            operations.forEach(function(p, i){
                var opt = Object.keys(p)[0];
                pipeline[opt](p[opt]);
            })
            $p._update = false;
            return pipeline;
        }

        $p.readResult = pipeline.result;

        pipeline.update = function() {
            $p._update = true;
            pipeline.resume('__init__');
            pipeline.filter($p.crossfilters);
            pipeline.register('__init__');
            return pipeline;
        }

        pipeline.getResult = function (d) {
            return $p.getResult(d);
        }

        pipeline.readPixels = function(arg) {
            var options = arg || {},
                offset = options.offset || [0, 0],
                resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
                rowSize = Math.min(resultSize, $p.dataDimension[0]),
                colSize = Math.ceil(resultSize/$p.dataDimension[0]);

            $p.bindFramebuffer(null);
            var gl = $p.ctx,
                result = new Uint8Array(rowSize * colSize * 4);

            gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, result);
            // console.log(result);
            return result.filter(function(d, i){ return i%4===3;} );
        }

        pipeline.head = pipeline.resume.bind(null, '__init__');
        pipeline.restart = pipeline.head;

        if(options.hasOwnProperty('data')) {
            pipeline.data(options.data);
        }

        return pipeline;
    }
});
