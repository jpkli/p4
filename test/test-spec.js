export default function(pp) {
    pp.input({
        type: 'text',
        method: 'http',
        source: '/data/ross-stats-rt-kps.fb',
        schema: {
            KP_ID: 'int',
            PE_ID: 'int',
            real_TS: 'float',
            current_GVT: 'float',
            time_ahead_GVT: 'float',
            total_rollbacks: 'int',
            secondary_rollbacks: 'int'
        },
        uniqueKeys: ['real_TS'],
        dimX: 13
        // indexes: ['real_TS', 'KP_ID']
    })
    .aggregate({
        $group: [ 'real_TS'],
        $reduce: {
            'AvgValues': {$avg: 'time_ahead_GVT'}
        }
    })
    .visualize({
        id: 'c2',
        mark: 'area',
        x: 'real_TS',
        y: 'AvgValues',
        color: 'green',
        zero: true,
    })
    .head()
    // .aggregate({
    //     $group: ['PE_ID'],
    //     $reduce: {
    //         time_ahead_GVT: {$avg: 'time_ahead_GVT'}
    //     }
    // })
    // .visualize({
    //     id: 'c1',
    //     mark: 'spline',
    //     x: 'PE_ID',
    //     y: 'time_ahead_GVT',
    //     color: 'red'
    // })
    // .head()
    .visualize({
        id: "c1",
        mark: 'circle',
        y: 'time_ahead_GVT',
        x: 'PE_ID',
        size: 'secondary_rollbacks',
        // color: 'secondary_rollbacks',
        animate: {
            mode: "auto",
            // grid: true
        },
    })


}