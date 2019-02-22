import {gradients as colorSchemes} from './gradients';
import {colorhex} from './colorhex';

const colorResolution = 256;
const colorSetMax = 32;
const defaultColorScheme = colorSchemes['viridis'];
const defaultColorSet = [
    "steelblue",
    "red",
    "teal",
    "orange",
    "purple"
];

let gradient = defaultColorScheme;
let colorset = defaultColorSet;

export default function color($p) {
    let colorManager = {};

    $p.uniform('uColorMode',       'int',   0) // 0=categorical, 1=numeric
        .uniform('uColorCount',    'int',   colorSetMax)
        .uniform('uColorSet',      'vec3',  setColorTable(colorset))
        // .uniform('uColorGradient', 'vec4', setColorScheme(gradient))
        .texture('tColorGradient', 'float', setColorScheme(gradient),  [colorResolution, 1], 'rgba')
        .subroutine('mapColorRGB', 'vec3',  mapColorRGB);

    colorManager.updateScheme = function(newColors) {
        if(typeof newColors == 'string' && colorSchemes.hasOwnProperty(newColors)) {
            gradient = colorSchemes[newColors];
        } else if(Array.isArray(newColors)) {
            gradient = newColors;
        }
        let colorGradient = setColorScheme(gradient)
        $p.texture.tColorGradient = colorGradient;
        // $p.texture.update('tColorGradient', colorGradient, [0, 0]);
    }

    colorManager.updateTable = function(colors) {
        colorset = colors;
        $p.uniform.uColorSet.data = setColorTable(colors);
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

    colorManager.updateColors = function(colors, colorMode) {
        
        colorManager.updateScheme(colors || defaultColorScheme);
        colorManager.updateTable(colors || defaultColorSet);
        if(Number.isInteger(colorMode)) {
            $p.uniform.uColorMode.data = colorMode;
        }
    }

    colorManager.rgb = rgb;
    colorManager.rgba = rgba;

    return colorManager;
}

function colorStrToHex(colorStr) {
    if (typeof colorhex[colorStr.toLowerCase()] != 'undefined') {
        return colorhex[colorStr.toLowerCase()];
    } else {
        return false;
    }
}

function rgb(hexStr) {
    var hex, r, g, b;

    if(hexStr.slice(0,1) == '#') {
        hex = hexStr.slice(1);
    } else {
        hex = colorStrToHex(hexStr).slice(1);
    }

    r = parseInt(hex.substring(0,2), 16) / 255;
    g = parseInt(hex.substring(2,4), 16) / 255;
    b = parseInt(hex.substring(4,6), 16) / 255;
    return [r, g, b];
}

function rgba(hexStr, alpha = 1.0) {
    let c = rgb(hexStr);
    return [c[0], c[1], c[2], alpha];
}

function rgba2hex(c) {
    var r = c[0],
        g = c[1],
        b = c[2],
        a = 1;
    if (r > 255 || g > 255 || b > 255 || a > 255) {
        throw 'Invalid color component';
    }
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
    let colorTable = new Float32Array(colorSetMax * 3);
    colors.forEach(function(c, i){
        let colorValue = rgb(c);
        colorTable[i*3] = colorValue[0];
        colorTable[i*3+1] = colorValue[1];
        colorTable[i*3+2] = colorValue[2];
    });
    return colorTable;
}

function mapColorRGB({fieldId = 'int', value = 'float'}) {
    var d = new Vec2();
    var colorRGB = new Vec3();
    var intValue = new Int();
    if(fieldId == -1) {
        colorRGB = this.uDefaultColor;
    } else {
        if(this.uColorMode == 1) {
            colorRGB = texture2D(this.tColorGradient, vec2(value, 1.0)).rgb;
        } else {
            d = this.uVisDomains[fieldId];
            intValue = int(value * (d.y - d.x));
            if(intValue >= this.uColorCount) {
                colorRGB = vec3(0.0, 0.0, 0.0);
            } else {
                colorRGB = this.uColorSet[intValue];
            }
        }
    }
    return colorRGB;
}
