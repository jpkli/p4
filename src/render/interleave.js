define(function(){
    'use strict';
    return function(fxgl) {
        var renderer = {};
        renderer.visualMap = function($int_fieldId, $float_rf, $float_cf, $float_v0, $float_exp){
            var value, t;
            if(fieldId >= this.uIndexCount) {
                if (fieldId >= this.uFieldCount + this.uIndexCount) {
                    t = (float(fieldId - this.uFieldCount - this.uIndexCount) + cf) /
                        float(this.uDeriveCount);
                    value = texture2D(this.fDerivedValues, vec2(rf, t)).a;
                } else {
                    t = (float(fieldId - this.uIndexCount) + cf) / float(this.uFieldCount);
                    value = texture2D(this.uDataInput, vec2(rf, t)).a;
                }

                $vec2(d);
                d = this.uVisDomains[fieldId];
                value = (value - d.x) / (d.y - d.x);

            } else if(fieldId > -1 && fieldId < this.uIndexCount) {
                value = (fieldId == 0) ? rf : cf;
            } else {
                value = v0;
            }
            if(exp != 0.0)
                value = pow(value, exp) ;
            // value = rf;
            return value;
        }

        renderer.visualMap.returnType = 'float';
        renderer.visualMap.fname = 'interleaveVisualMap';

        renderer.vs = function(){
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

            posX = this.interleaveVisualMap(this.uVisMapPosX, i, j, 0.0, 0.0);
            posY = this.interleaveVisualMap(this.uVisMapPosY, i, j, 0.0,  0.0);
            size = this.interleaveVisualMap(this.uVisMapSize, i, j, 1.0,  0.0);
            color = this.interleaveVisualMap(this.uVisMapColor, i, j, -1.0,  0.0);
            alpha = this.interleaveVisualMap(this.uVisMapAlpha, i, j, this.uDefaultAlpha, 0.0);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            if(color == -1.0)
                rgb = this.uDefaultColor;
            else
                rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;
            this.vColorRGBA = vec4(rgb*alpha, alpha);
            gl_Position = vec4(posX, posY, 0.0, 1.0);
        }

        renderer.fs = function() {

        }

        return renderer;
    }
})
