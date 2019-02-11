import aggregate  from './ops/aggregate';
import cache      from './ops/cache';
import derive     from './ops/derive';
import extent     from './ops/extent';
import match      from './ops/match';
import visualize  from './vis/visualize';
import reveal     from './vis/reveal';

export default function compile($p, fields, spec) {

    // if(spec.hasOwnProperty('perceptual'))
    //     operations.perceptual = kernels.perceptual($p);
    //
    // if(spec.hasOwnProperty('derive'))
    //     operations.derive = kernels.derive($p, spec.derive);

    return {
        aggregate : aggregate($p),
        cache     : cache($p),
        match     : match($p, fields),
        extent    : extent($p),
        visualize : visualize($p)
    }
}
