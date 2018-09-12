import derive from './derive';
import reveal from './reveal';
import aggregate from './aggregate';
import cache  from './cache';
import match from './match';
import extent from './extent';
import visualize from './visualize';

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
        // perceive  : kernels.reveal(fxgl)
    }
}
