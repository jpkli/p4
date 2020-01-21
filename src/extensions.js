import { vis } from 'p3.js';
// import animation from '../src/animate';

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
        function: vis.Spline
    },
    {
        name: 'area',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        condition: vmap => vmap.mark === 'area', 
        type: 'class',
        function: vis.AreaChart
    },
    {
        name: 'column',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        condition: vmap => vmap.mark === 'column', 
        type: 'class',
        function: vis.BarChart
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
