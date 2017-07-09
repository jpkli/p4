define(function Translator(require){
    var alloc = require('./allocate'),
        ajax = require('p4/io/ajax'),
        parser = require('p4/io/parser');

    var FlexGL = require('flexgl/flexgl'),
        aDAV = require('./adav');

    return function(config){
        var pipeline = {},
            config = config ||  {},
            container = config.container || null,
            width = config.width ||  800,
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


        pipeline.execute = function(){
            if(dataReady) {
                var offsetX, offsetY,
                    viewTotal = views.length,
                    viewCount = 0,
                    viewPadding = 30,
                    viewHeight = height / viewTotal ,
                    viewWidth = viewHeight;

                transforms.forEach(function(t){
                    var opt = Object.keys(t)[0];
                    console.log(opt);
                    adav[opt.slice(1)](t[opt]);
                })

                views.forEach(function(v, i){
                    var spec = Object.keys(v)[0];
                    console.log(spec);
                    offsetY = i * viewHeight;
                    adav.visualize(v[spec], i, [viewWidth, viewHeight], [0,  offsetY]);

                })
                adav.resume('reset');
            }
        }

        pipeline.run = function(spec, exec) {
            var exec = exec || false;
            transforms = spec.accelerate || spec.compute || spec.transform;
            views = transforms.filter(function(t){
                return Object.keys(t)[0] == "$render";
            }).reverse();

            transforms = transforms.filter(function(t){
                return Object.keys(t)[0] != "$render";
            });

            // if(!Array.isArray(views)){
            //     views = [views];
            // }

            var nestedViews = [];
            views.forEach(function(v, i){
                if(Array.isArray(v))
                    nestedViews = nestedViews.concat(v);
            });
            views = views.concat(nestedViews);

            if(exec)
                pipeline.execute();
        }

        pipeline.restart = function() {
            adav.resume('reset');
        }

        pipeline.init = function(spec, callback) {
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

                    if(typeof callback == 'function')
                        callback();
                })
            } else {
                adav = aDAV({
                    container: container,
                    context: fxgl,
                    data: data
                });
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
