define(function(require){
    var Class = require("./class"),
        Svg = require('./svg'),
        scale = require('./scale');

    function assign(object, source) {
        Object.keys(source).forEach(function(key) {
            object["$"+key] = source[key];
        });
    }

    var defaultProperties = {
        // width: 400,
        // height: 300,
        padding: {left: 0, right: 0, top: 0, bottom: 0},
    }

    return Class.create(function Viz(arg){
        "use strict";

        /* Private */
        var viz = this,
            option = arg || {},
            container = option.container || document.body,
            style = option.style || null,
            layers = [];

        this.$width = container.clientWidth || 400;
        this.$height = container.clientHeight || 300;

        if(typeof container == 'string') container = document.getElementById(container);
        assign(viz, defaultProperties);
        assign(viz, option);

        this.vmap = option.vmap;

        this.$width -= (this.$padding.left + this.$padding.right);
        this.$height -= (this.$padding.top + this.$padding.bottom);

        this.$svg = function(arg) {
            var arg = arg || {},
                width = arg.width || this.$width,
                height = arg.height || this.$height,
                padding = arg.padding || this.$padding;

            return new Svg({
                width: width,
                height: height,
                padding: padding,
                style: {position: 'absolute'}
            });
        }
        /* Public */
        this.data = option.data || [];
        this.div = document.createElement("div");
        if(style !== null) {
            Object.keys(style).forEach(function(prop){
                viz.div.style[prop] = style[prop];
            })
        }
        this.svg = [];
        this.canvas = [];
        this.init = function(){
            // container = (containerId == "body") ? document.body : document.getElementById(containerId);

            this.div.className = option.className || "i2v-viz";
            this.div.style.position = 'relative';
            this.resize(
                this.$width + this.$padding.left + this.$padding.right,
                this.$height + this.$padding.top + this.$padding.bottom
            );

            if(option.style) this.css(option.style);

            container.appendChild(this.div);
            return viz;
        };

        this.set = function(props) {
            assign(viz, props);
        };

        this.addProperty = function(obj, prop) {
            assign(obj, prop);
            return obj;
        }

        this.addLayer = function(layer) {
            if(layer.tagName == 'canvas') viz.canvas.push(layer);
            else viz.svg.push(layer);
        };

        this.viz = function(layer) {
            if(typeof layer !== 'undefined') this.addLayer(layer);
            viz.canvas.forEach(function(layer){
                viz.div.appendChild(layer);
            });
            viz.svg.forEach(function(g){
                viz.div.appendChild(g.svg);
            });
        };

        this.render = this.viz;

        this.css = function(style){
            for(var key in style){
                this.div.style[key] = style[key];
            }
            return this;
        };

        this.resize = function(w,h){
            this.div.style.width = w + "px";
            this.div.style.height = h + "px";
        };

        this.append = function(m) {
            if(m.tagName == "svg") this.svg.push(m);
            if(m.tagName == "canvas") this.webgl.push(m);
        };

        this.prepend = function(m) {
            if(m.tagName == "svg") this.svg = [m].concat(this.svg);
            if(m.tagName == "canvas") this.webgl = [m].concat(this.webgl);
        };

        this.destroy = function() {
            this._super.destroy();
            container.removeChild(this.div);
            div = null;
        };

        this.encode = function(attr, feature, scale) {

        };

        this.hide = function() {
            this.div.style.display = 'none';
        }

        this.show = function() {
            this.div.style.display = 'block';
        }

        this.innerWidth = function() {
            return this.$width;
        }

        this.innerHeight = function() {
            return this.$height;
        }

        return viz.init();
    });
})
