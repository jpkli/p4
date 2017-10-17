define(function(require){

    return function(option) {
        var plot = {},
            margin = option.margin || {top: 20, right: 20, bottom: 30, left: 40},
            width = option.width || 800,
            height = option.height || 450,
            container = option.container || "body",
            platform = option.platform || null,
            data = option.data || [],
            vmap = option.vmap,
            // domains = option.domains || {},
            onupdate = option.onupdate || function(){};

        if(platform == null) {
            var div = document.getElementById(container),
                canvas = document.createElement('canvas');
            div.appendChild(canvas);
            platform = Stardust.platform("webgl-2d", canvas, width, height);
        }

        var mark,
            attributes = vmap.y,
            xScale,
            yScale;

        plot.init = function() {
            var polyline = Stardust.mark.polyline();
            mark = Stardust.mark.create(polyline, platform);

            var instances = data;

            yScale = Stardust.scale.linear().domain([ 0, 1 ]).range([ height, 0 ]);
            xScale = Stardust.scale.linear().domain([ 0, attributes.length ]).range([ 0, width ]);

            let indices = attributes.map(function(d,i) { return i;});
            var domains = {};

            attributes.forEach(function(attr){
                domains[attr] = d3.extent(data, d => d[attr])
            })
            let convertInstance = (inst) => indices.map( i => [
                i,
                (inst[attributes[i]] - domains[attributes[i]][0]) / (domains[attributes[i]][1]- domains[attributes[i]][0]) // make sure data is in domain = [0, 1]
            ]);

            mark.instance((d) => {
                return convertInstance(d);
            })

            mark.data(instances);

            mark.attr("p", Stardust.scale.Vector2(
                xScale(d => d[0]),
                yScale(d => d[1])
            ));
            mark.attr("width", 0.25);
            mark.attr("color", [ 0.2, 0.5, 0.7, 0.2 ]);
        }

        plot.render = function() {

            mark.render();
            var gl = platform._GL,
                pixel = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel;
        }

        return plot;
    }

})
