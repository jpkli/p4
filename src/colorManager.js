define(function(require){
    var Color = require('i2v/colors'),
        colorSchemes = require('./colorSchemes'),
        colorResolution = 1024,
        colorCountMax = 32;

    var t20 = [
        [255,187,120],
        [255,127,14],
        [174,199,232],
        [44,160,44],
        [31,119,180],
        [255,152,150],
        [214,39,40],
        [197,176,213],
        [152,223,138],
        [148,103,189],
        [247,182,210],
        [227,119,194],
        [196,156,148],
        [140,86,75],
        [127,127,127],
        [219,219,141],
        [199,199,199],
        [188,189,34],
        [158,218,229],
        [23,190,207]
    ];

    function rgba2hex(c) {
        var r = c[0],
            g = c[1],
            b = c[2],
            a = 1;
        if (r > 255 || g > 255 || b > 255 || a > 255)
            throw "Invalid color component";
        return (256 + r).toString(16).substr(1) +((1 << 24) + (g << 16) | (b << 8) | a).toString(16).substr(1);
    }

    function setColorScheme(colors) {
        var cc = colors.length - 1,
            step = colorResolution / (cc+1),
            colorGradient = new Float32Array(colorResolution * 4);
        colors.push(colors[cc]);
        for(var i = 0; i < cc+1; i++) {
            var c0 = Color.rgba(colors[i]),
                c1 = Color.rgba(colors[i+1]),
                offset = Math.floor(i * step)*4;

            for(var x = 0; x < step; x++) {
                var xi = x / (step-1);
                colorGradient[offset+x*4] = c0[0] + (c1[0] - c0[0]) * xi;
                colorGradient[offset+x*4+1] = c0[1] + (c1[1] - c0[1]) * xi;
                colorGradient[offset+x*4+2] = c0[2] + (c1[2] - c0[2]) * xi;
                colorGradient[offset+x*4+3] = c0[3] + (c1[3] - c0[3]) * xi;
            }
        }
        return colorGradient;
    }

    function setColorTable(colors) {
        var colorTable = new Float32Array(colorCountMax * 3),
            rgb = false;

        if(colors[0].length == 3) rgb = true;
        colors.forEach(function(c, i){
            var colorValue = c;
            if(!rgb) colorValue = Color.rgb(c) * 255;
            colorTable[i*3] = colorValue[0] / 255;
            colorTable[i*3+1] = colorValue[1] / 255;
            colorTable[i*3+2] = colorValue[2] / 255;
        });

        return colorTable;
    }

    var gradient = setColorScheme(colorSchemes["viridis"]),
    // var gradient = setColorScheme(["blue", "green", "red"]),
        table = setColorTable(t20);

    return function(fxgl) {
        var colorManager = {};
        fxgl.texture("tColorGraident",  "float", gradient,  [colorResolution, 1], "rgba")
            .uniform("uColorTable",     "vec3",  table)
            .uniform("uColorCount",     "int",  20);

        colorManager.updateScheme = function(colors) {
            if(typeof colors == "string")
                colors = colorSchemes[colors].reverse()
            fxgl.texture = tColorGraident = setColorScheme(colors);
        }

        colorManager.updateTable = function(colors) {
            fxgl.uniform.uColorTable = setColorTable(colors);
        }

        colorManager.colorTable = t20.map(function(t){
            return rgba2hex(t);
        });

        colorManager.colorSchemes = function() {
            return colorSchemes["viridis"];
        }

        return colorManager;

    }

});
