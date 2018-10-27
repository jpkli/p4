import cstore from '../src/cstore';
import animation from '../src/animate';
import TimeSeries from './data-timeseries';

export default function () {
    let dataset = TimeSeries({
        timesteps: 128,
        series: 3,
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
    db.index('timestamp')
    console.log(db.data())

    let config = {
        container: "p4",
        viewport: [800, 600],
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
            "id": "c1",
            "width": 360,
            "height": 360,
            "padding": {"left": 50, "right": 10, "top": 10, "bottom": 50},
            "offset": [380, 0]
        },
        {
            "id": "c2",
            "width": 360,
            "height": 360,
            "padding": {"left": 120, "right": 10, "top": 10, "bottom": 50},
            "offset": [0, 0]
        }
    ];

    let gpu = p4(config).data(data).view(views);
    let animate = animation(gpu.ctx)
    gpu.extend({
        name: 'animate',
        exportData: false,
        skipDefault: true,
        condition: function(vmap) { return vmap.animate === true}, 
        procedure: function(result) {
            animate();
        },
    })

    let spec = [
        // {
        //     $match: {
        //         sid: [0, 10]
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
                x: 'sid',
                size: 9.0,
                y: 'traffic',
                // brush: {
                //     unselected: {color: '#cccccc'}
                // },
                // animate: true,
                opacity: 0.9
            }
        },
        {
            $visualize: {
                id: "c2",
                mark: 'circle',
                color: 'sattime',
                x: 'sid',
                size: 'sattime',
                y: 'traffic',
                // animate: true,
                opacity: 0.9
            }
        }
    ]
    
    let gpuResult = gpu.runSpec(spec);

    console.log(gpuResult);
}