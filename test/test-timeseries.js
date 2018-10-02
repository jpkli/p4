import cstore from '../src/cstore';
import TimeSeries from './data-timeseries';

export default function () {
    let dataset = TimeSeries({
        timesteps: 1024,
        series: 16,
        interval: 1,
        props: [
            {name: 'traffic', dtype: 'int',  dist: 'normal', min: 0, max: 10000, mean: 500, std: 180},
            {name: 'sattime', dtype: 'float',  dist: 'normal', min: 0, max: 10000, mean: 500, std: 180}
        ]
    })

    let db = cstore();
    db.import({
        data: dataset.data,
        schema: dataset.schema
    });

    let config = {
        container: "p4",
        viewport: [800, 600]
    };
    
    let data = db.data();
    data.indexes = ['timestamp', 'sid'];
    // data.indexes = ['sid', 'timestamp'];

    let views = [
        {id: 'c1', width: 600, height: 600, padding: {left: 70, right: 10, top: 50, bottom: 60}}
    ];

    // let views = [
    //     {
    //         "id": "c1",
    //         "width": 360,
    //         "height": 360,
    //         "padding": {"left": 50, "right": 10, "top": 10, "bottom": 50},
    //         "offset": [380, 0]
    //     },
    //     {
    //         "id": "c2",
    //         "width": 360,
    //         "height": 360,
    //         "padding": {"left": 120, "right": 10, "top": 10, "bottom": 50},
    //         "offset": [0, 0]
    //     }
    // ];

    let gpu = p4(config).data(data).view(views);

    let spec = [
        // {
        //     $match: {
        //         timestamp: [0, 10]
        //     }
        // },
        // {
        //     $aggregate: {
        //         $group: ['timestamp'],
        //         $reduce: {
        //             traffic: {$sum: 'traffic'},
        //             sattime: {$sum: 'sattime'}
        //         }
        //     }
        // },
        // {
        //     $derive: {
        //         "gid": "floor( float(sid) / 4.0)"
        //     }
        // },
        {
            $visualize: {
                id: "c1",
                mark: 'circle',
                color: 'sattime',
                x: 'sattime',
                size: 9.0,
                y: 'traffic',
                brush: {
                    unselected: {opacity: 0}
                },
                animate: true,
                opacity: 0.25
            }
        },
        // {
        //     $visualize: {
        //         id: "c2",
        //         mark: 'circle',
        //         color: 'sattime',
        //         x: 'sid',
        //         size: 'sattime',
        //         y: 'traffic',
        //         // animate: true,
        //         opacity: 0.25
        //     }
        // }
    ]
    
    let gpuResult = gpu.runSpec(spec);

    console.log(gpuResult);
}