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
            var i, j;
            $vec3(rgb);
            var posX, posY, size, color, alpha;
            gl_PointSize = this.uMarkSize;
            i = (this.aIndex0+0.5) / this.uDataDim.x;
            j = (this.aIndex1+0.5) / this.uDataDim.y;

            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            posX = this.directVisualMap(this.uVisMapPosX, i, j, 0.0, 0.0);
            posY = this.directVisualMap(this.uVisMapPosY, i, j, 0.0,  0.0);
            size = this.directVisualMap(this.uVisMapSize, i, j, 1.0,  0.0);
            color = this.directVisualMap(this.uVisMapColor, i, j, -1.0,  0.0);
            alpha = this.directVisualMap(this.uVisMapAlpha, i, j, this.uDefaultAlpha, 0.0);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            if(color == -1.0)
                rgb = this.uDefaultColor;
            else
                rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
            this.vColorRGBA = vec4(rgb*alpha, alpha);
            gl_Position = vec4(posX, posY, 0.0, 1.0);
        };

        renderer.fs = function() {

        }

        return renderer;
    }
})
