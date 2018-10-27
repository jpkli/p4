import cstore from '../src/cstore';
import animation from '../src/animate';
import p3 from 'p.3';
import testSpec from './test-spec';

export default function () {

    let config = {
        container: "p4",
        viewport: [1000, 600],
        
    };
    
    let views = [
        {
            id: 'c1', width: 900, height: 400, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 50, bottom: 40},
            offset: [0, 200]
        },
        {
            id: 'c2', width: 900, height: 200, 
            gridlines: {y: true},
            padding: {left: 70, right: 10, top: 0, bottom: 40},
            offset: [0, 0]
        }
    ];

    let pp = p4(config).view(views);
    pp.extend({
        name: 'animate',
        // exportData: true,
        skipDefault: true,
        getContext: true,
        restartOnUpdate: false,
        condition: function(vmap) { return vmap.animate !== undefined}, 
        procedure: animation
    })

    pp.extend({
        name: 'animation-average',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        compute: true,
        condition: function(vmap) { return vmap.mark == 'spline'}, 
        procedure: function(data, view) {
            console.log(data)
            // let collection = {};
            // collection[view.encodings.y] =  {$avg: view.encodings.y};

            // let result = p3.pipeline().aggregate({
            //     $group: [ view.encodings.x],
            //     $reduce: collection
            // }).execute(data.json)

            var s = d3.select(view.svg.svg);

            var x = d3.scaleLinear()
                .domain(data.domains[view.encodings.x])
                .range([0, view.width - view.padding.left - view.padding.right]);
            
            var y = d3.scaleLinear()
                .domain(data.domains[view.encodings.y])
                .range([view.height - view.padding.top - view.padding.bottom, 0]);
            
            var line = d3.line()
                .curve(d3.curveBasis)
                .x(function(d, i) { return x(d[view.encodings.x]); })
                .y(function(d, i) { return y(d[view.encodings.y]); });

            s.append("path")
                .datum(data.json)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", "red")
                .style("stroke-width", 3)
            }
    })


    pp.extend({
        name: 'area',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        condition: function(vmap) { return vmap.mark === 'area'}, 
        procedure: function(data, view) {
            let x = d3.scaleLinear()
                .domain(data.domains[view.encodings.x])
                .range([0, view.width]);
            
            let y = d3.scaleLinear()
                .domain(data.domains[view.encodings.y])
                .range([view.height, 0]);
            
            let area = d3.area()
                .curve(d3.curveBasis)
                .x(function(d, i) { return x(d[view.encodings.x]); })
                .y0(view.height)
                .y1(function(d, i) { return y(d[view.encodings.y]); });
    
            view.svg.append("path")
                .attr("d", area(data.json))
                .style("fill", view.encodings.color)
                .style("stroke", view.encodings.color)
                .style("stroke-width", 3)
        }
    })


    testSpec(pp);
    // pp.input({
    //     type: 'text',
    //     method: 'http',
    //     source: '/data/ross-stats-rt-kps.fb',
    //     schema: {
    //         KP_ID: 'int',
    //         PE_ID: 'int',
    //         real_TS: 'float',
    //         current_GVT: 'float',
    //         time_ahead_GVT: 'float',
    //         total_rollbacks: 'int',
    //         secondary_rollbacks: 'int'
    //     },
    //     uniqueKeys: ['real_TS'],
    //     dimX: 13
    //     // indexes: ['real_TS', 'KP_ID']
    // })
    // .aggregate({
    //     $group: [ 'real_TS'],
    //     $reduce: {
    //         'time_ahead_GVT': {$avg: 'time_ahead_GVT'}
    //     }
    // })
    // .visualize({
    //     id: "c2",
    //     mark: 'area',
    //     x: 'real_TS',
    //     y: 'time_ahead_GVT',
    //     opacity: 0.9,
    //     test: true,
    //     zero: true,
    //     brush: {
    //         condition: {x: true, y: false},
    //     },
    // })
    // .head()
    // .visualize({
    //     id: "c1",
    //     mark: 'circle',
    //     y: 'time_ahead_GVT',
    //     // color: 'steelblue',
    //     x: 'KP_ID',
    //     size: 10,
    //     color: 'total_rollbacks',
    //     animate: true,
    //     opacity: 0.9
    // })
    // .interact({
    //     from: 'c2',
    //     event: 'brush',
    //     condition: {x: true, y: false},
    //     response : {
    //         "c1": {
    //             "unselected": {"color": "gray"}
    //         },
    //         "c2": {
    //             "selected": {"color": "orange"}
    //         }
    //     }
    // })

    // let gpuResult = gpu.runSpec(spec);

    // console.log(gpuResult);
}