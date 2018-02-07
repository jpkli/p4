import derive from './derive';
import reveal from './reveal';
import aggregate : './aggregate';
import cache  from './cache';
import match from './match';
import extent from './extent';
import visualize from './visualize';


export default function(fxgl, fields, spec) {
    var operations = {
        aggregate : aggregate(fxgl),
        cache     : cache(fxgl),
        match     : match(fxgl, fields),
        extent    : extent(fxgl),
        visualize : visualize(fxgl),
        // perceive  : kernels.reveal(fxgl)
    }

    // if(spec.hasOwnProperty('perceptual'))
    //     operations.perceptual = kernels.perceptual(fxgl);
    //
    // if(spec.hasOwnProperty('derive'))
    //     operations.derive = kernels.derive(fxgl, spec.derive);

    return operations;
}
