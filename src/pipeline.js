define(function(require) {

    var arrays = require('./arrays'),
        allocate = require('./allocate'),
        output = require('./output'),
        utils = require('./utils'),
        config = require('./config'),
        cstore = require('./cstore'),
        compile = require('./compile'),
        optDerive = require('./derive');

    return function pipeline(options) {
        var pipeline = {},
            registers = {},
            profiles  = [],
            opt = {},
            optID = 0,
            rerun = false;

        var $p = config(options);

        $p.getResult = function() {};

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
            allocate($p, dataOptions);
            opt = compile($p);
            if(!$p.hasOwnProperty('fieldDomains')) {
                var dd = opt.extent($p.fields.map((f, i) => i), $p.dataDimension);
                console.log(dd);
                // $p.uniform.uFieldDomains.data = $p.fieldDomains;
            }
            $p.opt = opt;
            pipeline.ctx = $p.ctx;
            pipeline.register('__init__');

            return pipeline;
        }

        pipeline.view = function(views) {
            $p.views.forEach(function(v){
                if(v.hasOwnProperty('chart')) {
                    v.chart.svg.remove();
                    delete v.chart;
                }
            })
            $p.views = views;
        }

        pipeline.register = function(tag) {
            registers[tag] = {
                indexes: $p.indexes,
                dataSize: $p.dataSize,
                fields: $p.fields,
                dataDim: $p.uniform.uDataDim.data.slice(),
                fieldWidths: $p.fieldWidths.slice(),
                fieldDomains: $p.fieldDomains.slice(),
                deriveCount: $p.deriveCount,
                filterFlag: $p.uniform.uFilterFlag.data,
                filterControls: $p.uniform.uFilterControls.data.slice(),
                dataInput: $p.uniform.uDataInput.data,
                attribute: {
                    aDataIdx: {
                        ids: $p.attribute.aDataIdx.data,
                        value: $p.attribute.aDataValx.data
                    },
                    aDataIdy: {
                        ids: $p.attribute.aDataIdy.data,
                        value: $p.attribute.aDataValy.data
                    },
                    aDataFieldId: $p.attribute.aDataFieldId.data,
                    aDataItemId: $p.attribute.aDataItemId.data
                }
            }

            // console.log(">>>>>>>>>registered ", tag, registers[tag]);
            return pipeline;
        }

        pipeline.resume = function(tag) {
            addToPipeline('resume', tag);
            if (!registers.hasOwnProperty(tag))
                throw new Error('"' + tag + '" is not found in regesters.');

            var reg = registers[tag];
            // console.log('************* resume to ', tag, reg);
            //resume CPU registers
            $p.indexes = reg.indexes;
            $p.dataSize = reg.dataSize;
            $p.deriveCount = reg.deriveCount;
            $p.fieldCount = reg.fields.length - reg.indexes.length - reg.deriveCount;
            $p.fields = reg.fields.slice();
            $p.fieldWidths = reg.fieldWidths.slice();
            $p.fieldDomains = reg.fieldDomains.slice();
            $p.dataDimension = reg.dataDim.slice();

            //resume GPU Uniforms
            $p.uniform.uFieldCount.data = $p.fieldCount;
            $p.uniform.uDataSize.data = $p.dataSize;
            $p.uniform.uDataDim.data = reg.dataDim;
            $p.uniform.uIndexCount.data = reg.indexes.length;
            $p.uniform.uFieldDomains.data = reg.fieldDomains;
            $p.uniform.uFieldWidths.data = reg.fieldWidths;
            $p.uniform.uFilterFlag.data = reg.filterFlag;
            // $p.uniform.uFilterControls.data = reg.filterControls;
            $p.uniform.uDataInput.data = reg.dataInput;

            //resume GPU Attribute Buffers
            $p.attribute['aDataIdx'] = reg.attribute['aDataIdx'].ids;
            $p.attribute['aDataIdy'] = reg.attribute['aDataIdy'].ids;
            $p.attribute['aDataValx'] = reg.attribute['aDataIdx'].value;
            $p.attribute['aDataValy'] = reg.attribute['aDataIdy'].value;
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdx'].location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdy'].location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValx'].location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValy'].location, 1);

            $p.attribute['aDataFieldId'] = reg.attribute['aDataFieldId'];
            $p.attribute['aDataItemId'] = reg.attribute['aDataItemId'];

            return pipeline;
        }

        pipeline.bin = function (spec) {
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
                spec.$group = pipeline.bin(spec);
                delete spec.$bin;
            }

            addToPipeline('aggregate', spec);
            if(Object.keys($p.crossfilters).length)
                $p.uniform.uFilterFlag = 1;

            opt.aggregate.execute(spec);
            // console.log(pipeline.result('row'));
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

            //TODO: support JS function as expression for deriving new variable
            //.replace(/function\s*[\w|\d]+\s*\((.+)\)/g, "$1")
            // if (!opt.hasOwnProperty('derive')) {
                opt.derive = optDerive($p, spec);
            // }
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
            var viewIndex = 0,
                filters = {};

            if(typeof vmap.id == 'string') {
                viewIndex = $p.views.map(d=>d.id).indexOf(vmap.id);
                if(viewIndex == -1) {
                    //find next available view slot in all views
                    for(var vi = 0; vi < $p.views.length; vi++){
                        if(!$p.views[vi].id) {
                            viewIndex = vi;
                            $p.views[viewIndex].id = vmap.id;
                            break;
                        }
                    }
                }

            }
            $p.views[viewIndex].vmap = vmap;

            var viewOptions = {
                vmap: vmap,
                viewOrder: viewIndex
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
                    viewOptions.interaction = function(selection) {
                        // console.log('selections:::::::::', selection);
                        // $p._update = true;
                        rerun = true;
                        if(typeof selection == 'object') {
                            Object.keys(selection).forEach(function(k) {
                                if(selection[k].length < 2) {
                                    if($p.intervals.hasOwnProperty(k)) {
                                        var value = (Array.isArray(selection[k]))
                                            ? selection[k][0]
                                            : selection[k];
                                        selection[k] = [value-$p.intervals[k].interval, value];
                                    } else if(!$p.categoryLookup.hasOwnProperty(k)) {
                                        selection[k] = [selection[k][0] + selection[k][0] + 1];
                                    }
                                }
                                $p.crossfilters[k] = selection[k];
                            });

                            pipeline.update();
                            // console.log('$p.crossfilters::::::', $p.crossfilters, $p.fieldDomains);

                            var operations = $p.pipeline.slice(0, optID);

                            for (var i = 0, l = $p.pipeline.length; i < l; i++) {
                                var p = $p.pipeline[i];
                                if(Object.keys(p)[0] == 'filter') {
                                    Object.keys(selection).forEach(function(k) {
                                        p.filter[k] = selection[k];
                                    });

                                    break;
                                }
                            }
                        } else {
                            pipeline.update();
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
            $p.uniform.uFilterLevel.data = 0.5;
            pipeline.resume('__init__');

            pipeline.filter($p.crossfilters);
            // pipeline.register('__init__');
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

        pipeline.runSpec = function(specs) {
            pipeline.head();
            $p.bindFramebuffer("offScreenFBO");
            $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
            $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
            $p.bindFramebuffer("visStats");
            $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
            $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
            $p.bindFramebuffer(null);
            $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
            $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
            $p.pipeline = [];
            $p.crossfilters = [];
            $p.uniform.uFilterFlag = 0;
            // $p.uniform.uFilterRanges = $p.fieldDomains.concat($p.deriveDomains);
            specs.forEach(function(spec){
                var opt = Object.keys(spec)[0],
                    arg = spec[opt];

                opt = opt.slice(1);
                if(typeof pipeline[opt] == 'function') {
                    pipeline[opt](arg);
                }
            })
        }

        pipeline.head = function() {
            pipeline.resume('__init__');
            return pipeline;

        }
        // pipeline.restart = pipeline.head;

        if(options.hasOwnProperty('data')) {
            pipeline.data(options.data);
        }

        return pipeline;
    }
});
