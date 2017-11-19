define(function(require){

    return function(option) {

        var plot = {},
            margin = option.margin || {top: 20, right: 20, bottom: 30, left: 40},
            width = option.width || 1280,
            height = option.height || 720,
            container = option.container || "body",
            platform = option.platform || null,
            data = option.data || [],
            vmap = option.vmap,
            domains = option.domains || {},
            onupdate = option.onupdate || function(){};

        if(platform == null) {
            var div = document.getElementById(container),
                canvas = document.createElement('canvas');
            div.appendChild(canvas);
            platform = Stardust.platform("webgl-2d", canvas, width, height);
        }

        var circles, scaleX, scaleY;

        plot.init = function() {
            let circle = new Stardust.mark.circle(16);

            circles = Stardust.mark.create(circle, platform);
            circles.data(data);
            scaleX = Stardust.scale.linear()
                .domain(d3.extent(data, d => d[vmap.x]))
                .range([ 0, width]);

            scaleY = Stardust.scale.linear()
                .domain(d3.extent(data, d => d[vmap.y]))
                .range([ 0, height ]);



        }

        plot.render = function() {
            circles.attr("center", Stardust.scale.Vector2(scaleX(d => d[vmap.x]), scaleY(d => d[vmap.y])));
            circles.attr("radius", 1);
            circles.attr("color", [ 0.3, 0.5, 0.7, 0.2 ]);
            circles.render();
            var gl = platform._GL,
                pixel = new Uint8Array(4);

            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel;
        }

        return plot;
    }

})
