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
            // let collection = {};
            // collection[view.encodings.y] =  {$avg: view.encodings.y};

            // let result = p3.pipeline().aggregate({
            //     $group: [ view.encodings.x],
            //     $reduce: collection
            // }).execute(data.json)

            var s = d3.select(view.svg);

            var x = d3.scaleLinear()
                .domain(data.domains[view.encodings.x])
                .range([0, view.width]);
            
            var y = d3.scaleLinear()
                .domain(data.domains[view.encodings.y])
                .range([view.height, 0]);
            
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
    
            d3.select(view.svg).append("path")
                .attr("d", area(data.json))
                .style("fill", view.encodings.color)
                .style("stroke", view.encodings.color)
                .style("stroke-width", 3)
            view.svg.onclick = function() {
                console.log(pp.ctx.animation)
            }
        }
    })


    document.getElementById('abutton').onclick = function(){
        pp.ctx.animation.stop = !pp.ctx.animation.stop;

        if(!pp.ctx.animation.stop) {
            
            pp.ctx.animation.start();
        }
    }
    testSpec(pp);
}