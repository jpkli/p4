import {gradients as colorSchemes} from './gradients';
import {colorhex} from './colorhex';

const colorResolution = 256;
const colorSetMax = 32;
const defaultColorScheme = colorSchemes['viridis'];
const defaultColorSet = [
    [255,187,120], [255,127, 14], [174,199,232], [ 44,160, 44],
    [ 31,119,180], [255,152,150], [214, 39, 40], [197,176,213],
    [152,223,138], [148,103,189], [247,182,210], [227,119,194],
    [196,156,148], [140, 86, 75], [127,127,127], [219,219,141],
    [199,199,199], [188,189, 34], [158,218,229], [ 23,190,207]
];

var gradient = defaultColorScheme,
    colorset = defaultColorSet;

export default function color($p) {
    var colorManager = {};

    $p.uniform('uColorMode',       'int',   0) // 0=categorical, 1=numeric
        .uniform('uColorCount',    'int',   colorSetMax)
        .uniform('uColorSet',      'vec3',  setColorTable(colorset))
        .texture('tColorGraident', 'float', setColorScheme(gradient),  [colorResolution, 1], 'rgba')
        .subroutine('mapColorRGB', 'vec3',  mapColorRGB);

    colorManager.updateScheme = function(newColors) {
        if(typeof newColors == 'string' && colorSchemes.hasOwnProperty(newColors)) {
            gradient = colorSchemes[newColors];
        } else if(Array.isArray(newColors)) {
            gradient = newColors;
        }
        $p.texture.tColorGraident = setColorScheme(gradient);
    }

    colorManager.updateTable = function(colors) {
        colorset = colors;
        $p.uniform.uColorSet = setColorTable(colors);
    }

    colorManager.colorTable = defaultColorSet.map(function(t){
        return rgba2hex(t);
    });

    colorManager.getColors = function() {
        if($p.uniform.uColorMode == 0) {
            return colorset;
        } else {
            return gradient;
        }
    }

    colorManager.rgb = rgb;
    colorManager.rgba = rgba;

    return colorManager;
}

function colorStrToHex(colorStr) {
    if (typeof colorhex[colorStr.toLowerCase()] != 'undefined')
        return colorhex[colorStr.toLowerCase()];
    else
        return false;
}

function rgb(hexStr) {
    var hex, r, g, b;

    if(hexStr.slice(0,1) == '#')
        hex = hexStr.slice(1);
    else
        hex = colorStrToHex(hexStr).slice(1);

    r = parseInt(hex.substring(0,2), 16) / 255;
    g = parseInt(hex.substring(2,4), 16) / 255;
    b = parseInt(hex.substring(4,6), 16) / 255;
    return [r, g, b];
}

function rgba(hexStr, alpha) {
    var a = alpha || 1.0,
        c = rgb(hexStr);

    return [c[0], c[1], c[2], a];
}

function rgba2hex(c) {
    var r = c[0],
        g = c[1],
        b = c[2],
        a = 1;
    if (r > 255 || g > 255 || b > 255 || a > 255)
        throw 'Invalid color component';
    return (256 + r).toString(16).substr(1) +((1 << 24) + (g << 16) | (b << 8) | a).toString(16).substr(1);
}

function setColorScheme(colors) {
    var cc = colors.length - 1,
        step = (cc >= 0) ? colorResolution / (cc+1) : 1,
        colorGradient = new Float32Array(colorResolution * 4);

    colors.push(colors[cc]);
    for(var i = 0; i < cc+1; i++) {
        var c0 = rgba(colors[i]),
            c1 = rgba(colors[i+1]),
            offset = Math.floor(i * step)*4;

        for(var x = 0; x < step; x++) {
            var xi = x / (step);
            colorGradient[offset+x*4]   = c0[0] + (c1[0] - c0[0]) * xi;
            colorGradient[offset+x*4+1] = c0[1] + (c1[1] - c0[1]) * xi;
            colorGradient[offset+x*4+2] = c0[2] + (c1[2] - c0[2]) * xi;
            colorGradient[offset+x*4+3] = c0[3] + (c1[3] - c0[3]) * xi;
        }
    }
    colors.pop();
    return colorGradient;
}

function setColorTable(colors) {
    var colorTable = new Float32Array(colorSetMax * 3),
        isRgb = false;

    if(colors[0].length == 3) isRgb = true;
    colors.forEach(function(c, i){
        var colorValue = c;
        if(!isRgb) colorValue = rgb(c) * 255;
        colorTable[i*3] = colorValue[0] / 255;
        colorTable[i*3+1] = colorValue[1] / 255;
        colorTable[i*3+2] = colorValue[2] / 255;
    });

    return colorTable;
}

function mapColorRGB($int_fieldId, $float_value) {
    var d = new Vec2();
    var colorRGB = new Vec3();
    var intValue = new Int();
    if(fieldId == -1) {
        colorRGB = this.uDefaultColor;
    } else {
        if(this.uColorMode == 1) {
            colorRGB = texture2D(this.tColorGraident, vec2(value, 1.0)).rgb;
        } else {
            d = this.uVisDomains[fieldId];
            intValue = int(value * (d.y - d.x) + d.x);
            if(intValue >= this.uColorCount) {
                colorRGB = vec3(0.0, 0.0, 0.0);
            } else {
                colorRGB = this.uColorSet[intValue];
            }
        }
    }
    return colorRGB;
}
