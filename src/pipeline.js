define(function Pipeline(require){
    var alloc = require('./allocate'),
        ajax = require('p4/io/ajax'),
        parser = require('p4/io/parser');

    var FlexGL = require('flexgl/flexgl'),
        aDAV = require('./adav');

    return function(config){
        var pipeline = {},
            config = config ||  {},
            container = config.container || null,
            width = config.width ||  1200,
            height = config.height || 800,
            padding = config.padding || {left: 60, right: 0, top: 20, bottom: 20};

        if(height < width / 6) height = width;

        var queue = [],
            csv = null,
            data = null,
            opt = {},
            result,
            adav,
            transforms,
            views;

        var dataReady = false;

        var fxgl = new FlexGL({
            width: width,
            height: height,
            padding: padding,
        });

        fxgl.padding = padding;
        fxgl.viewport = [width, height];
        fxgl.container = container;


        pipeline.exec = function(spec){
            transforms = spec.accelerate || spec.transform;
            if(dataReady) {
                transforms.forEach(function(t){
                    var opt = Object.keys(t)[0];
                    console.log(opt);
                    adav[opt.slice(1)](t[opt]);
                })
                adav.head();
            }
        }

        pipeline.restart = function() {
            adav.head();
        }

        pipeline.init = function(spec, exec) {
            var dataOptions = spec.data || spec;
            if(Array.isArray(dataOptions)) dataOptions = dataOptions[0];

            if(dataOptions.protocol == 'http') {
                ajax.get(
                     {url: dataOptions.path, dataType: "text"}
                ).then(function(text){
                    var csv = parser(text, ',');
                    dataOptions.buffer = csv;
                    dataOptions.size = csv.length;


                    var db = alloc(dataOptions);
                    data = db.data();
                    data.stats = db.stats();

                    dataReady = true;
                    adav = aDAV({
                        container: container,
                        context: fxgl,
                        data: data
                    });

                    if(exec)
                        pipeline.exec(spec);
                })
            }

        }

        pipeline.data = function(d) {
            data = d;
            dataReady = true;
        }
        pipeline.$render = function(arg) {
            adav.visualize(arg, viewCount, [viewWidth, viewHeight], [0,  offsetY]);
            viewCount++;
        }

        return pipeline;

    }
});
