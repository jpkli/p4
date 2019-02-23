import programs from './kernels';
import compile from './compile';
import * as arrayOpt from './arrays';

export default function($p) {
    let operations = {};
    let kernels = compile($p);
    let bin = function (spec, binIndex) {
        let binAttr;
        let binCount;
    
        if (typeof spec == 'object') {
            binAttr = Object.keys(spec)[0];
            binCount = spec[binAttr];
        } else {
            binAttr = spec;
            // Apply Sturges' formula for determining the number of bins
            binCount = Math.ceil(Math.log2($p.dataSize)) + 1;
        }
        let binAttrId = $p.fields.indexOf(binAttr);
        let binDomain = $p.fieldDomains[$p.fields.indexOf(binAttr)];
        let binInterval = (binDomain[1] - binDomain[0]) / binCount;
        // debugger
        $p.uniform.uBinCount.data[binIndex] = binCount;
        $p.uniform.uBinIntervals.data[binIndex] = binInterval;
        $p.fieldWidths[binAttrId] = binCount;    
        $p.intervals[binAttr] = {};
        $p.intervals[binAttr].dtype = 'histogram';
        $p.intervals[binAttr].interval = binInterval;
        $p.intervals[binAttr].min = binDomain[0];
        $p.intervals[binAttr].max = binDomain[1];
        $p.histograms.push(binAttr);
        return binAttr;
    }
    
    operations.aggregate = function (spec) {
        if(spec.$bin) { 
            let binSpecs = Array.isArray(spec.$bin) ? spec.$bin : [spec.$bin];
            let binAttrs = binSpecs.map((spec, ii) => {
                return bin(spec, ii);
            })
            if(spec.$group) {
                spec.$group = binAttrs.concat(spec.$group)
            } else {
                spec.$group = binAttrs;
            }
        }
        if(Object.keys($p.crossfilters).length) {
            $p.uniform.uFilterFlag = 1;
        }
        if (!kernels.hasOwnProperty('aggregate')) {
            kernels.aggregate = programs.aggregate($p, spec);
        }
        kernels.aggregate.execute(spec);
        return kernels.aggregate.result;
    }

    operations.match = function(spec) {
        if (!kernels.hasOwnProperty('match')) {
            kernels.match = programs.match($p);
        }
        kernels.match.execute(spec);
        return kernels.match.result;
    }

    operations.cache = function(tag) {
        if (!kernels.hasOwnProperty('cache')) {
            kernels.cache = programs.cache($p);
        }
        kernels.cache.execute(tag);
        return kernels.cache.result;
    }

    operations.derive = function(spec) {
        // if (!kernels.hasOwnProperty('derive')) {
        if(!$p._update) {
            kernels.derive = programs.derive($p, spec);
        }
        // }
        kernels.derive.execute(spec);
        return kernels.derive.result;
    }

    operations.visualize = function(vmap) {
        // if(Object.keys($p.crossfilters).length > 0)
        //     operations.match({});
        let vmaps;
        if(vmap.facets) {
            let facet = vmap.facets;
            let sortOpt = Object.keys(facet.sortBy)[0];
            let sortAttr = facet.sortBy[sortOpt];
            let result = $p.exportResult('row');
            let spec = facet.rows || facet.columns;
            let sorted = spec[sortAttr].map((fields) => {
                let values = result.map(r => r[fields])
                let min = 0;
                let max = Math.max(...values);
                let normalizedValues = values.map( val => (val - min) / (max - min) )
                if (sortOpt === 'var') sortOpt = 'variance';
                let opt = typeof(arrayOpt[sortOpt]) === 'function' ? sortOpt : 'avg'
                return {
                    name: fields,
                    value: arrayOpt[opt](normalizedValues)
                }
            })
            .sort((a, b) => b.value - a.value )
            .map(r => r.name);
            spec[sortAttr] = sorted;

            let encodings = Object.keys(vmap).filter(k => k !== 'facets')

            let variables = Object.keys(spec)
            let minLoopCount = Math.min(...variables.map(v => spec[v].length))

            vmaps = new Array(minLoopCount)
            for(let i = 0; i < minLoopCount; i++) {
                let rule = {}
                encodings.forEach(code => {
                    let vi = variables.indexOf(vmap[code])
                    if(vi < 0) {
                    rule[code] = vmap[code]     
                    } else {
                    rule[code] = spec[variables[vi]][i]
                    }
                })
                vmaps[i] = rule
            }
        } else {
            vmaps = Array.isArray(vmap) ? vmap : [vmap];
        }

        if($p.grid.views.length < vmaps.length) {
            $p.grid.reset();
            $p.views = $p.grid.generateViews({
                count: vmaps.length, 
                width: $p.viewport[0],
                height: $p.viewport[1],
                padding: $p.padding
            })
        }
        vmaps.forEach( (vmap, vi) => {
            if (!kernels.hasOwnProperty('visualize')) {
                kernels.visualize = programs.visualize($p);
            }
            if (vmap.in) {
                console.log('load input', vmap.in)
                $p.setInput(vmap.in);

                // $p.uniform.uDataInput.data = $p.framebuffer[vmap.in].texture;

            }
            let viewIndex = vi;
            if(typeof vmap.id == 'string') {
                viewIndex = $p.views.map(d=>d.id).indexOf(vmap.id);
                if(viewIndex == -1) {
                    //find the next available view slot in all views
                    for(let vi = 0; vi < $p.views.length; vi++){
                        if(!$p.views[vi].id) {
                            viewIndex = vi;
                            $p.views[viewIndex].id = vmap.id;
                            break;
                        }
                    }
                }
            }

            if(vmap.mark == 'bar') vmap.zero = true;
            $p.views[viewIndex].vmap = vmap;
            let encoding = vmap,
                viewTag = $p.views[viewIndex].id;
    
            if($p._update && $p.responses.hasOwnProperty(viewTag)) {
                if($p.responses[viewTag].hasOwnProperty($p._responseType)) {
                    encoding = Object.assign({}, vmap, $p.responses[viewTag][$p._responseType]);
                }
            }
            if(encoding.opacity != 0){
                kernels.visualize({
                    vmap: encoding,
                    viewIndex: viewIndex
                });
                $p.respond();
            }
        })
        $p.reset();
    }

    return operations;
}