define(function(require){
    return function Selector(arg){
        "use restrict";
        var option = arg || {},
            container = option.container || this.svg[0],
            width = option.width || this.$width,
            height = option.height || this.$height,
            x = function(s) {return s},
            y = function(s) {return s},
            base = option.base || null,
            selectX = option.x || false,
            selectY = option.y || false,
            border = option.border || "#FFF",
            color = option.color || "#111",
            brush = option.brush || function() {},
            brushstart = option.brushstart || function() {},
            brushend = option.brushend || function() {};

        if(typeof(selectX) === "function") {
            x = selectX;
            selectX = true;
        }

        if(typeof(selectY) === "function") {
            y = selectY;
            selectY = true;
        }

        this.x = function(xMap) {
            if(typeof xMap === "function") x = xMap;
        }

        this.y = function(yMap) {
            if(typeof yMap === "function") y = yMap;
        }


        if(base === null){
            base = container.append("g")
                    .attr("class", "selector");
        } else {
            base = container;
        };


        base.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill-opacity", 0)
            .attr("stroke", "none")
            .css("cursor", "crosshair");

        var selector = base.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0)
            .attr("fill-opacity", 0.1)
            .css("fill", color)
            .css("stroke", border)
            .css("cursor", "move");

        var sx, sy,
            dx, dy,
            bx, by,
            selection = {},
            intStart = false,
            drag = false;

        base.svg.addEventListener("mousedown", function(evt){
            evt.preventDefault();
            intStart = true;
            sx = evt.clientX;
            sy = evt.clientY;

            var sp = selector.svg.getBoundingClientRect();
            var box = base.svg.getBoundingClientRect();

            if(sx>sp.left && sy>sp.top && sx<sp.left+sp.width && sy<sp.top+sp.height) {
                drag = true;
                bx = sp.left;
                by = sp.top;
            }

            brushstart.call(this);

            if(!drag){
                x0 = selectX ? sx - box.left : 0;
                y0 = selectY ? sy - box.top: 0;
                selector.attr("x", x0)
                    .attr("y", y0)
                    .attr("width", 0);
            }

            ondrag = function(evt){
                if(intStart){
                    dx = evt.clientX - sx;
                    dy = evt.clientY - sy;
                    var selectorBox = selector.svg.getBoundingClientRect();

                    if(drag){
                        var x0, y0, nw, nh;
                        var nx = bx + dx-box.left,
                            ny = by + dy-box.top;

                        if(bx+dx < box.left) nx = 0;

                        if(bx+dx+selectorBox.width > box.right) nx = width - selectorBox.width ;
                        if(by+dy < box.top) ny = 0;
                        if(by+dy+selectorBox.height > box.bottom) ny = height - selectorBox.height;

                        selector.attr("x", nx).attr("y", ny);

                    } else {
                        if(evt.clientX < box.left) dx = box.left - sx;
                        if(evt.clientX > box.right) dx = box.right - sx;
                        if(evt.clientY > box.bottom) dy = box.bottom - sy;
                        if(evt.clientY < box.top) dy = box.top - sy;

                        x0 = selectX ? sx + dx - box.left: 0;
                        y0 = selectY ? sy + dy - box.top : 0;
                        nw = selectX ? Math.abs(dx) : width;
                        nh = selectY ? Math.abs(dy) : height;

                        selector.attr("width", nw).attr("height", nh);
                        if(dx<0 && dy>=0) selector.attr("x", x0);
                        if(dy<0 && dx>=0) selector.attr("y", y0);
                        if(dx<0 && dy<0) selector.attr("x", x0).attr("y", y0);
                    }
                    if(selectX)
                        selection.x = [ x(selectorBox.left - box.left ), x(selectorBox.right - box.left )];

                    if(selectY)
                        selection.y = [y(selectorBox.top - box.top), y(selectorBox.bottom - box.top)];

                    brush.call(this, selection);
                    // console.log(selection.x, selection.y);
                }
            };

            window.addEventListener("mousemove", ondrag, false);
            window.addEventListener("mouseup", function(evt){
                brushend.call(this, selection);
                if(intStart){
                    intStart = false;
                    if(drag){
                        drag = false;
                    }

                }
                window.removeEventListener("mousemove", ondrag, false);
            }, false);
        });

    };

});
