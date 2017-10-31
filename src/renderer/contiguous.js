define(function(){
    'use strict';
    return function(fxgl) {
        var renderer = {};
        renderer.visualMap = function($int_fieldId, $float_rf, $float_cf, $float_v0, $float_exp){

            var value;
            if(fieldId >-1) {
                $vec2(d);
                d = this.uVisDomains[fieldId];
                value = this.getData(fieldId, rf, cf);
                value = (value - d.x) / (d.y - d.x);
            } else {
                value = v0;
            }
            if(exp != 0.0)
                value = pow(value, exp);
            return value;
        };

        renderer.visualMap.returnType = 'float';
        renderer.visualMap.fname = 'directVisualMap';

        renderer.vs = function() {
            var i, j, posX, posY, color, alpha, width, height, size;
            var rgb = new Vec3();

            i = (this.aDataIdx+0.5) / this.uDataDim.x;
            j = (this.aDataIdy+0.5) / this.uDataDim.y;

            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }


            posX = this.directVisualMap(this.uVisualEncodings[0], i, j, 0.0, 0.0);
            posY = this.directVisualMap(this.uVisualEncodings[1], i, j, 0.0,  0.0);
            color = this.directVisualMap(this.uVisualEncodings[2], i, j, -1.0,  0.0);
            alpha = this.directVisualMap(this.uVisualEncodings[3], i, j, this.uDefaultAlpha, 0.0);
            size = this.directVisualMap(this.uVisualEncodings[6], i, j, -1.0,  0.0);
            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            rgb = (color == -1.0) ? this.uDefaultColor : texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
            // gl_PointSize = (size == -1.0) ? this.uMarkSize : size * 20.0;
            gl_PointSize = 20.0;
            this.vColorRGBA = vec4(rgb, alpha);
            gl_Position = vec4(posX, posY, 0.0, 1.0);
        };

        renderer.fs = function() {
            if(this.vResult == this.uVisLevel) {
                if(this.uVisShape == 1) {
                    var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
                    if (dist > 0.5) discard;
                    var delta = 0.2;
                    var alpha = this.vColorRGBA.a - smoothstep(0.45-delta, 0.45, dist);
                    gl_FragColor = vec4(this.vColorRGBA.rgb, alpha);
                } else {
                    gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a,  this.vColorRGBA.a);
                }
            } else {
                discard;
            }
        }

        return renderer;
    }
})
