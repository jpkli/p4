define(function(require){

    const genData = require('src/gen-json');

    var benchmark = {
        lib: null,
        data: null,
        dopt: {},
        vis: {},
        va: {}
    };

    var spec,
        containerId,
        width,
        height,
        domains = {},
        program,
        setupTime;

    benchmark.setup = function(options) {
        var data = options.data,
            container = options.container;

        containerId = container.id || 'body';
        width = container.width || 800;
        height = container.height || 450;

        if(!Array.isArray(data)) {
            data.props.forEach(function(d) {
                domains[d.name] = [d.min, d.max];
            });

            data = genData({
                size: data.size,
                props: data.props
            });
        }

        spec = {
            "$schema": "https://vega.github.io/schema/vega/v3.0.json",
            "width": width,
            "height": height,
            "padding": 5,
            "autosize": "pad",
        };

        benchmark.lib = options.lib || vega || null;
        benchmark.data = data;
        spec.data = [
            {
                "name": "benchmarkData",
                "values": benchmark.data
            },
            {
                "name": 'result',
                "source":  "benchmarkData",
            }
        ];

        return execute(spec);
    }

    benchmark.cleanUp = function() {
        document.getElementById(containerId.slice(1)).innerHTML = ''
    }

    function execute(newSpec) {
        var startTime = performance.now();

        program = new benchmark.lib.View(benchmark.lib.parse(newSpec));
            // .logLevel(vega.Info)
        program.renderer('canvas')  // set renderer (canvas or svg)
            .initialize(containerId) // initialize view within parent DOM container


        setupTime = performance.now() - startTime;
        program.run();
        // program.render();

        // var r = program.data('result');
        // console.log(r);
        return performance.now() - startTime;
    }

    function filter(options) {
        var expr = [];

        Object.keys(options).forEach(function(key){
            expr.push('datum.' + key + ' >= ' + options[key][0] +
                ' && datum.' + key + ' < '+  options[key][1])
        });

        return expr.join(' ');
    }


    benchmark.dopt.select = function(options) {
        spec.data[1].transform = [
            { "type": "filter", "expr": filter(options) }
        ];

        return execute(spec);
    }

    benchmark.dopt.derive = function(options) {
        var attr = Object.keys(options)[0],
            expr = options[attr];

        spec.data[1].transform = [
            {"type": "formula", "as": attr, "expr": expr}
        ];

        return execute(spec);
    }

    benchmark.dopt.aggregate = function(options) {
        var fields = Object.keys(options).filter((d)=>(d!='$group'));

        spec.data[1].transform =  [
            {
              "type": "aggregate",
              "groupby": [options.$group],
              "fields": fields.map((d)=>options[d].$sum),
              "ops":  fields.map((d)=>Object.keys(options[d])[0].slice(1))
            }
        ];

        return execute(spec);
    }

    benchmark.vis.scatterPlot = function(options) {
        spec.scales = [{
            "name": "x",
            "type": "linear",
            "round": true,
            "nice": true,
            "zero": false,
            "domain": {"data": "benchmarkData", "field": options.x},
            "range": [0,width]
        },{
            "name": "y",
            "type": "linear",
            "round": true,
            "nice": true,
            "zero": false,
            "domain": {"data": "benchmarkData", "field": options.y},
            "range": [height,0]
        }];

        spec.axes = [{
            "scale": "x",
            "grid": true,
            "domain": false,
            "orient": "bottom",
            "tickCount": 5,
            "title": "x"
        },{
            "scale": "y",
            "grid": true,
            "domain": false,
            "orient": "left",
            "titlePadding": 5,
            "title": "y"
        }];

        spec.marks = [{
            "name": "marks",
            "type": "symbol",
            "from": {"data": "benchmarkData"},
            "encode": {
              "update": {
                "x": {"scale": "x", "field": options.x},
                "y": {"scale": "y", "field": options.y},
                "shape": {"value": "circle"},
                "opacity": {"value":  0.5},
                "fill": {"value": options.color || "#4682b4"}
              }
            }
         }];

         var profile = {};

         profile.total = execute(spec);
         var ts = performance.now();
         program.render();

         profile.render = performance.now() - ts;
         profile.init = profile.total - profile.render;

         return profile;
    }

    benchmark.vis.parallelCoordinates = function(options) {
        var attributes = options.y;
        spec.data[2] = {
            name: 'fields',
            values: attributes
        }

        spec.scales = [{
            name: 'ord', type: 'point',
            range: "width", round: true,
            domain: {data: "fields", field: "data"}
        }];

        spec.axes = [];

        attributes.forEach(function(attr){
            var scale = {
                name: attr,
                type: 'linear',
                range: 'height',
                zero: false,
                nice: true,
                domain: {data: 'benchmarkData', field: attr}
            };

            var axis = {
                orient: "left",
                zindex: 1,
                scale: attr,
                title: attr,
                offset: {scale: "ord", value: attr, "mult": -1}
            };

            spec.scales.push(scale);
            spec.axes.push(axis);

            spec.config = {
                "axisY": {
                  "titleX": -2,
                  "titleY": height + 10,
                  "titleAngle": 0,
                  "titleAlign": "right",
                  "titleBaseline": "top"
                }
              }

            spec.marks = [{
              "type": "group",
              "from": {"data": "benchmarkData"},
              "marks": [
                {
                  "type": "line",
                  "from": {"data": "fields"},
                  "encode": {
                    "enter": {
                      "x": {"scale": "ord", "field": "data"},
                      "y": {
                        "scale": {"datum": "data"},
                        "field": {"parent": {"datum": "data"}}
                      },
                      "stroke": {"value": "steelblue"},
                      "strokeWidth": {"value": 0.2},
                      "strokeOpacity": {"value": 0.2}
                    }
                  }
                }
              ]
            }]
        })

        var profile = {};

        profile.total = execute(spec);
        var ts = performance.now();
        program.render();

        profile.render = performance.now() - ts;
        profile.init = profile.total - profile.render;

        return profile;
    }

    benchmark.va.histogram = function(options) {

    }

    return benchmark;
})
