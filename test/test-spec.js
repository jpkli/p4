export default function(pp) {
    let t = pp.input({
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
        // dimX: 13
        indexes: [ 'real_TS', 'KP_ID']
        // indexes: [ 'KP_ID', 'real_TS',]
    })
    .aggregate({
        $group: [ 'real_TS'],
        $reduce: {
            'AvgValues': {$avg: 'time_ahead_GVT'}
        }
    })
    .visualize([{
        id: 'c2',
        mark: 'area',
        x: 'real_TS',
        y: 'AvgValues',
        color: 'green',
        zero: true,
    }]);
    // .head()
    
    t.aggregate({
        $group: [ 'PE_ID'],
        $reduce: {
            time_ahead_GVT: {$avg: 'time_ahead_GVT'}
        }
    })
    .visualize({
        id: 'c1',
        // append: true,
        mark: 'spline',
        x: 'PE_ID',
        y: 'time_ahead_GVT',
        color: 'red'
    })
    // .head()

    // t.visualize({
    //     id: "c1",
    //     mark: 'circle',
    //     y: 'time_ahead_GVT',
    //     x: 'PE_ID',
    //     append: true,
    //     // size: 'secondary_rollbacks',
    //     size: 10,
    //     color: 'red',
    //     // color: 'secondary_rollbacks',
    //     opacity: 0.5,
    //     animate: true
    // })
    // .interact({
    //     from: 'c2',
    //     event: 'brush',
    //     condition: {x: true, y: false},
    //     response : {
    //         "c1": {
    //             "unselected": {"opacity": 0}
    //         },
    //         "c2": {
    //             "selected": {"color": "orange"}
    //         }
    //     }
    // })
    t.commit()

}