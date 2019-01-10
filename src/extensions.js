import pplot from 'p.plot';
import animation from '../src/animate';

export default [
    {
        name: 'spline',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        compute: true,
        condition: vmap => vmap.mark === 'spline', 
        type: 'class',
        function: pplot.Spline
    },
    {
        name: 'area',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        condition: vmap => vmap.mark === 'area', 
        type: 'class',
        function: pplot.AreaChart
    },
    // {
    //     name: 'animate',
    //     // exportData: true,
    //     skipDefault: true,
    //     getContext: true,
    //     restartOnUpdate: false,
    //     condition: vmap => vmap.mark === 'circle' && vmap.animate === true, 
    //     function: animation
    // }
]