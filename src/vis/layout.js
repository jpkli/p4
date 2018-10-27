import Svg from './svg';
import chart from './chart';

function assign(object, source) {
    Object.keys(source).forEach(function(key) {
        object[key] = source[key];
    });
}
var defaultProperties = {
    width: 400,
    height: 300,
    padding: {left: 0, right: 0, top: 0, bottom: 0},
}

export default function layout(arg){
    "use strict";

    /* Private */
    var viz = this,
        option = arg || {},
        container = option.container || document.body,
        style = option.style || null,
        layers = [];

    this.width = container.clientWidth || 400;
    this.height = container.clientHeight || 300;

    if(typeof container == 'string') container = document.getElementById(container);
    assign(viz, defaultProperties);
    assign(viz, option);

    this.vmap = option.vmap;

    this.width -= (this.padding.left + this.padding.right);
    this.height -= (this.padding.top + this.padding.bottom);


    /* Public */
    this.data = option.data || [];
    this.div = document.createElement("div");
    if(style !== null) {
        Object.keys(style).forEach(function(prop){
            viz.div.style[prop] = style[prop];
        })
    }

    this.init = function(){
        // container = (containerId == "body") ? document.body : document.getElementById(containerId);

        this.div.className = option.className || "p6-viz";
        this.div.style.position = 'relative';
        this.resize(
            this.width + this.padding.left + this.padding.right,
            this.height + this.padding.top + this.padding.bottom
        );

        if(option.style) this.css(option.style);

        container.appendChild(this.div);
        this.viz();
        return viz;
    };

    this.createSVG = function(arg) {
        var arg = arg || {},
            width = arg.width || this.width,
            height = arg.height || this.height,
            padding = arg.padding || this.padding;

        return new Svg({
            width: width,
            height: height,
            padding: padding,
            style: {position: 'absolute'}
        });
    }

    var canvas = option.canvas,
        svg = this.createSVG(),
        vmap = option.vmap,
        chartPadding = this.padding || {left: 0, right: 0, top: 0, bottom: 0},
        domain = option.domain || {x: [0, 1000], y: [0, 1]},
        scales = option.scales || {x: 'linear', y: 'linear'};

    var backSVG = this.createSVG(),
        frontSVG = this.createSVG();

    this.set = function(props) {
        assign(viz, props);
    };

    this.addProperty = function(obj, prop) {
        assign(obj, prop);
        return obj;
    }

    this.viz = function() {
        viz.div.appendChild(backSVG.svg);
        viz.div.appendChild(canvas);
        viz.div.appendChild(frontSVG.svg);
        return viz;
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

    this.destroy = function() {
        this._super.destroy();
        container.removeChild(this.div);
        div = null;
    };

    this.hide = function() {
        this.div.style.display = 'none';
    }

    this.show = function() {
        this.div.style.display = 'block';
    }

    this.innerWidth = function() {
        return this.width;
    }

    this.innerHeight = function() {
        return this.height;
    }

    this.addChart = function(options) {
        return chart(frontSVG, backSVG, options)
    };

    this.exportImage = function(beforeExport) {
        var imageCanvas = document.createElement("canvas");
        imageCanvas.width = this.width;
        imageCanvas.height = this.height;
        return new Promise(function(resolve, reject) {

            var ctx = imageCanvas.getContext("2d");
            var svgString = new XMLSerializer().serializeToString(frontSVG.svg);

            var DOMURL = self.URL || self.webkitURL || self;
            var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
            var svgURL = DOMURL.createObjectURL(svgBlob);

            var canvasLayer = new Image();
            var svgLayer = new Image();
            canvasLayer.onload = function() {
                ctx.drawImage(canvasLayer, 0, 0);
                svgLayer.src = svgURL;
                svgLayer.onload = function() {
                    ctx.drawImage(svgLayer, 0, 0);
                    var png = imageCanvas.toDataURL("image/png");
                    DOMURL.revokeObjectURL(png);
                    resolve(png);
                };
            };

            canvasLayer.onerror = function() {
                reject(Error("Canvas Output Error!"));
            }

            svgLayer.onerror = function() {
                reject(Error("SVG Output Error!"));
            }
            beforeExport();
            canvasLayer.src = canvas.toDataURL("image/png");
        });

    }

    return viz.init();
};
