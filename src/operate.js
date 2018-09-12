import programs from './kernels';

export default function($p) {
    let operations = {};
    let kernels = {};
    let bin = function (spec) {
        var deriveSpec = {},
            binAttr,
            binCount;
    
        if (typeof spec == 'object') {
            binAttr = Object.keys(spec)[0];
            binCount = spec[binAttr];
        } else {
            binAttr = spec;
            // Apply Sturges' formula for determining the number of bins
            binCount = Math.ceil(Math.log2($p.dataSize)) + 1;
        }
    
        var binDomain = $p.fieldDomains[$p.fields.indexOf(binAttr)];
        var binInterval = (binDomain[1] - binDomain[0]) / binCount;
    
        var histFunction = (function() { max(ceil((binAttr - binMin) / float(binInterval)), 1.0) })
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
        operations.derive(deriveSpec);
        // var deriveFields = $p.fields.slice(-$p.deriveCount),
        //     dfid = deriveFields.indexOf('bin@'+binAttr);
        // $p.deriveDomains[dfid] = [stats[binAttr].min, stats[binAttr].max];
        return 'bin@'+binAttr;
    }
    
    operations.aggregate = function (spec) {
        if(spec.$bin) {
            spec.$group = bin(spec.$bin);
            delete spec.$bin;
        }

        if(Object.keys($p.crossfilters).length) {
            $p.uniform.uFilterFlag = 1;
        }
        
        if (!kernels.hasOwnProperty('aggregate')) {
            kernels.aggregate = programs.aggregate($p, spec);
        }
        kernels.aggregate.execute(spec);
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
            kernels.cache = programs.cache($p, spec);
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
        if (!kernels.hasOwnProperty('visualize')) {
            kernels.visualize = programs.visualize($p);
        }
        
        var viewIndex = 0;
        if(typeof vmap.id == 'string') {
            viewIndex = $p.views.map(d=>d.id).indexOf(vmap.id);
            if(viewIndex == -1) {
                //find the next available view slot in all views
                for(var vi = 0; vi < $p.views.length; vi++){
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
        var encoding = vmap,
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
        // return pipeline;
    }

    return operations;
}