import cstore from '../src/cstore';
import animation from '../src/animate';
import TimeSeries from './data-timeseries';

export default function () {
    let dataset = TimeSeries({
        timesteps: 20,
        series: 512,
        interval: 100,
        props: [
            {name: 'traffic', dtype: 'int',  dist: 'normal', min: 0, max: 10000, mean: 500, std: 180},
            {name: 'sattime', dtype: 'float',  dist: 'normal', min: 0, max: 10000, mean: 500, std: 180}
        ]
    })

    let db = cstore({ indexes: {timestamp: true}});
    db.import({
        data: dataset.data,
        schema: dataset.schema,
    });
    // db.index('timestamp')
    console.log(db.data())

    let config = {
        container: "p4",
        viewport: [800, 800],
        // async: true
    };
    
    let data = db.data();
    data.indexes = ['timestamp', 'sid'];
    // data.indexes = ['sid', 'timestamp'];

    // let views = [
    //     {id: 'c1', width: 600, height: 600, padding: {left: 70, right: 10, top: 50, bottom: 60}}
    // ];

    let views = [
        {
            "width": 800,
            "height": 400,
            "padding": {"left": 50, "right": 10, "top": 10, "bottom": 50},
            "offset": [0, 400],
            "gridlines": {x: true, y: true}
        },
        // {
        //     "id": "c2",
        //     "width": 360,
        //     "height": 360,
        //     "padding": {"left": 120, "right": 10, "top": 10, "bottom": 50},
        //     "offset": [0, 360]
        // }
    ];

    let gpu = p4(config).data(data).view(views);
    // let animate = animation(gpu.ctx)
    // gpu.extend({
    //     name: 'animate',
    //     exportData: false,
    //     skipDefault: true,
    //     condition: function(vmap) { return vmap.animate === true}, 
    //     procedure: function(result) {
    //         animate();
    //     },
    // })

    let spec = [
        // {
        //     $visualize: {
        //         id: "c2",
        //         mark: 'circle',
        //         // color: 'sattime',
        //         x: 'sattime',
        //         size: 9.0,
        //         y: 'traffic',
        //         brush: {
        //             unselected: {color: '#cccccc'}
        //         },
        //         // animate: true,
        //         // zoom: {
        //         //     unselected: {color: '#cccccc'}
        //         // },
        //         color: 'teal',
        //         opacity: 'auto'
        //     }
        // },
        {
            $visualize: {
                id: 'c1',
                mark: 'line',
                // color: 'sattime',
                color: 'blue',
                x: 'timestamp',
                size: 1,
                y: 'traffic',
                // animate: true,
                // opacity: 0.25,
                opacity: 'auto'
            }
        },
        // {
        //     $interact :{
        //         from: 'c1',
        //         event: ['pan', 'zoom'],
        //         // condition: {y: true},
        //         response : {
        //             "c2": {
        //                 "unselected": {"color": "gray"}
        //             }
        //         }
        //     }
        // }
        
    ]
    
    let gpuResult = gpu.runSpec(spec);

    console.log(gpuResult);
}