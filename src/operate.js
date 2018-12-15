import programs from './kernels';
import compile from './compile';

export default function($p) {
    let operations = {};
    let kernels = compile($p);
    let bin = function (spec) {
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
    
        $p.uniform.uBinCount.data = binCount;
        $p.uniform.uBinIntervals.data = [binInterval, 0.0];
        
        $p.fieldWidths[binAttrId] = binCount;    
        $p.intervals[binAttr] = {};
        $p.intervals[binAttr].dtype = 'historgram';
        $p.intervals[binAttr].interval = binInterval;
        $p.intervals[binAttr].min = binDomain[0];
        $p.intervals[binAttr].max = binDomain[1];

        $p.histograms.push(binAttr)

        return binAttr;
    }
    
    operations.aggregate = function (spec) {
        if(spec.$bin) {
            spec.$group = bin(spec.$bin);
        }

        if(Object.keys($p.crossfilters).length) {
            $p.uniform.uFilterFlag = 1;
        }
        
        if (!kernels.hasOwnProperty('aggregate')) {
            kernels.aggregate = programs.aggregate($p, spec);
        }
        kernels.aggregate.execute(spec);
        return kernels.aggregate.result;
        // console.log(JSON.stringify(result('row')));

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
        if (!kernels.hasOwnProperty('derive')) {
            kernels.derive = programs.derive($p, spec);
        }
        kernels.derive.execute(spec);
        return kernels.derive.result;
    }
    
    operations.visualize = function(vmap) {
        // if(Object.keys($p.crossfilters).length > 0)
        //     operations.match({});
        let vmaps = Array.isArray(vmap) ? vmap : [vmap];

        vmaps.forEach( (vmap) => {
            if (!kernels.hasOwnProperty('visualize')) {
                kernels.visualize = programs.visualize($p);
            }
            let viewIndex = 0;
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
        // return pipeline;
    }

    return operations;
}