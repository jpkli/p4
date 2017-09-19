define(function(require) {

    var arrays = require('p4/core/arrays'),
        init = require('./init'),
        output = require('./output'),
        utils = require('./utils'),
        config = require('./config'),
        cstore = require('./cstore'),
        compile = require('./compile');

    var optDerive = require('./derive');

    return function pipeline(options) {
        var pipeline = {};

        var context = config(options);

        var registers = {},
            profiles  = [];

        var rerun = false,
            opt = {},
            optID = 0;

        function addToPipeline(opt, arg) {
            if(!rerun || !context._update) {
                var spec = {};
                spec[opt] = arg;
                context.pipeline.push(spec);
                return optID++;
            } else {
                return -1;
            }
        }

        pipeline.data = function(dataOptions) {
            init(context, dataOptions);
            opt = compile(context, context.fields, {});
            context.opt = opt;
            pipeline.ctx = context.ctx;
            pipeline.register('__init__');
            pipeline.head = pipeline.resume.bind(null, '__init__');
            return pipeline;
        }

        context.getResult = function() {};

        pipeline.register = function(tag) {
            registers[tag] = {
                indexes: context.indexes,
                fields: context.fields,
                dataDim: context.uniform.uDataDim.data.slice(),
                fieldWidths: context.fieldWidths,
                fieldDomains: context.fieldDomains,
                deriveCount: context.deriveCount,
                deriveWidths: context.deriveWidths,
                deriveDomains: context.deriveDomains,
                filterFlag: context.uniform.uFilterFlag.data,
                filterControls: context.uniform.uFilterControls.data.slice(),
                dataInput: context.uniform.uDataInput.data,
                attribute: [{
                        id: context.attribute.aIndex0.data,
                        value: context.attribute.aIndex0Value.data
                    },
                    {
                        id: context.attribute.aIndex1.data,
                        value: context.attribute.aIndex1Value.data
                    },
                ]
            }
            console.log("registered ", tag, registers);
            return pipeline;
        }

        pipeline.resume = function(tag) {
            addToPipeline('resume', tag);
            if (!registers.hasOwnProperty(tag))
                throw new Error('"' + tag + '" is not found in regesters.');

            var reg = registers[tag];

            context.indexes = reg.indexes;
            context.deriveCount = reg.deriveCount;
            context.fieldCount = reg.fields.length - reg.indexes.length - reg.deriveCount;
            context.uniform.uFieldCount.data = context.fieldCount;
            context.uniform.uDataDim.data = reg.dataDim;
            context.uniform.uIndexCount.data = reg.indexes.length;
            context.uniform.uFieldDomains.data = reg.fieldDomains;
            context.uniform.uFieldWidths.data = reg.fieldWidths;
            context.uniform.uDeriveDomains.data = reg.deriveDomains;
            context.uniform.uDeriveWidths.data = reg.deriveWidths;
            context.uniform.uFilterFlag.data = reg.filterFlag;
            // context.uniform.uFilterControls.data = reg.filterControls;
            context.uniform.uDataInput.data = reg.dataInput;

            context.fields = reg.fields;
            context.fieldWidths = reg.fieldWidths;
            context.fieldDomains = reg.fieldDomains;
            context.deriveDomains = reg.deriveDomains;
            context.deriveWidths = reg.deriveWidths;
            context.dataDimension = reg.dataDim;

            context.attribute['aIndex0'] = reg.attribute[0].id;
            context.attribute['aIndex1'] = reg.attribute[1].id;

            context.attribute['aIndex0Value'] = reg.attribute[0].value;
            context.attribute['aIndex1Value'] = reg.attribute[1].value;

            gl.ext.vertexAttribDivisorANGLE(context.attribute['aIndex0'].location, 0);
            gl.ext.vertexAttribDivisorANGLE(context.attribute['aIndex1'].location, 1);
            gl.ext.vertexAttribDivisorANGLE(context.attribute['aIndex0Value'].location, 0);
            gl.ext.vertexAttribDivisorANGLE(context.attribute['aIndex1Value'].location, 1);

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
                binCount = Math.ceil(Math.log2(context.dataSize)) + 1;
            }

            var binDomain = context.fieldDomains[context.fields.indexOf(binAttr)];
            var binInterval = (binDomain[1] - binDomain[0]) / binCount;

            var histFunction = (function() {max(ceil((binAttr - binMin) / float(binInterval)), 1.0)})
                .toString()
                .slice(13, -1) // remove "function () {" from function.toString
                .replace('binAttr', binAttr)
                // .replace('binCount', binCount + '.0')
                .replace('binMin', binDomain[0] + '.0')
                .replace('binInterval', binInterval)

            deriveSpec['bin@'+binAttr] = histFunction;
            context.intervals[binAttr] = {};
            context.intervals[binAttr].dtype = 'historgram';
            context.intervals[binAttr].interval = binInterval;
            context.intervals[binAttr].min = binDomain[0];
            context.intervals[binAttr].max = binDomain[1];
            context.intervals[binAttr].align = 'right';
            pipeline.derive(deriveSpec);
            // var deriveFields = context.fields.slice(-context.deriveCount),
            //     dfid = deriveFields.indexOf('bin@'+binAttr);
            // context.deriveDomains[dfid] = [stats[binAttr].min, stats[binAttr].max];
            return 'bin@'+binAttr;
        }

        pipeline.aggregate = function(spec) {
            if(spec.$bin) {
                spec.$group = binnedAggregation(spec);
                delete spec.$bin;
            }

            addToPipeline('aggregate', spec);
            if(Object.keys(context.crossfilters).length)
                context.uniform.uFilterFlag = 1;

            opt.aggregate.execute(spec);

            return pipeline;
        }

        pipeline.filter = function(spec) {
            addToPipeline('filter', spec);

            opt.select.execute(spec);
            context.getResult = opt.select.result;
            return pipeline;
        }

        pipeline.select = pipeline.filter;

        pipeline.derive = function(spec) {
            addToPipeline('derive', spec);
            var derive;

            if (opt.hasOwnProperty('derive'))
                derive = opt.derive;
            else
                derive = optDerive(context, spec);

            derive.execute(spec);
            return pipeline;
        }

        pipeline.cache = function(tag) {
            opt.cache.execute(tag);
            // console.log(cache.result());
            return pipeline;
        }

        pipeline.visualize = function(vmap) {
            var optID = addToPipeline('visualize', vmap);
            var viewDim = viewDim || context.viewport;

            var filters = {};
            if(typeof vmap.id == 'string') {
                var viewIndex = context.viewNames.indexOf(vmap.id);
                if( viewIndex == -1) {
                    context.viewNames.push(vmap.id);
                    vmap.id = context.viewNames.length - 1;
                } else {
                    vmap.id = viewIndex;
                }
            }

            var viewOptions = {
                vmap: vmap,
                fields: context.fields,
                domains: context.fieldDomains,
                dataDim: context.dataDimension,
                categories: context.categoryLookup,
                intervals: context.intervals,
                viewOrder: vmap.id,
                width: context.views[vmap.id].width,
                height: context.views[vmap.id].height,
                offset: context.views[vmap.id].offset
            };

            if(!rerun) {
                if(vmap.hasOwnProperty('interact')) {
                    viewOptions.interaction = function(d) {
                        // console.log(d);
                        context._update = true;
                        rerun = true;
                        // pipeline.head();
                        vmap.interact(d);
                        rerun = false;
                    }
                }
                else if(context.interaction == 'auto') {
                    viewOptions.interaction = function(d) {

                        context._update = true;
                        rerun = true;
                        Object.keys(d).forEach(function(k) {
                            if(d[k].length < 2) {
                                if(context.intervals.hasOwnProperty(k)) {
                                    var value = (Array.isArray(d[k])) ? d[k][0] : d[k];
                                    d[k] = [value-context.intervals[k].interval, value];
                                }
                            }
                            context.crossfilters[k] = d[k];
                        });
                        pipeline.update();
                        console.log('context.crossfilters::::::', context.crossfilters, context.fieldDomains);

                        // var operations = context.pipeline.slice(0, optID);
                        // var filtering = false;
                        // for (var i = 0, l = context.pipeline.length; i < l; i++) {
                        //     var p = context.pipeline[i];
                        //     if(Object.keys(p)[0] == 'filter') {
                        //         Object.keys(d).forEach(function(k) {
                        //             p.filter[k] = d[k];
                        //         });
                        //         filtering = true;
                        //         break;
                        //     }
                        // }

                        pipeline.run();
                        // Object.keys(d).forEach(function(k) {
                        //     delete context.crossfilters[k];
                        // });
                        rerun = false;
                        // pipeline.run(operations.concat(context.pipeline.slice(optID)));
                        // pipeline.run([{filter: filters}].concat(context.pipeline));

                        // console.log('**interactive latency:', performance.now() - start);
                    };
                }
                context.viewID++;

            }

            opt.visualize(viewOptions);

            return pipeline;
        }

        pipeline.clear = function() {
            console.log(context.visLayers);
        }

        pipeline.read = function() {
            console.log("Read>>", context.getResult());
            return pipeline;
        }

        pipeline.result = output(context);

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
            console.log(context.pipeline);
        }

        pipeline.run = function(opts) {
            var operations = opts || context.pipeline;
            operations.forEach(function(p, i){
                var opt = Object.keys(p)[0];
                pipeline[opt](p[opt]);
            })
            context._update = false;
            return pipeline;
        }

        context.readResult = pipeline.result;

        pipeline.update = function() {
            context._update = true;
            pipeline.resume('__init__');
            pipeline.filter(context.crossfilters);
            pipeline.register('__init__');
            return pipeline;
        }

        if(options.hasOwnProperty('data')) {
            pipeline.data(options.data);
        }

        return pipeline;
    }
});
