define(function(){

    return function(fxgl) {
        var renderer = {};
        renderer.visualMap = function($int_fieldId, $float_rf, $float_cf, $float_v0, $float_exp){
            var value;
            if(fieldId >= this.uIndexCount) {

                value = this.getNonIndexedData(fieldId, rf, cf);
                $vec2(d);
                d = this.uVisDomains[fieldId];
                value = (value - d.x) / (d.y - d.x);

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
            i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
            j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

            this.vResult = 1.0;
            if(this.uFilterFlag == 1) {
                if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                    this.vResult = 0.0;
            }

            // posX = visualMap(this.uVisualEncodings[0], i, j, 0.0, 0.0);
            if(this.uVisualEncodings[0] == -1) {
                posX = this.aDataFieldId.y / float(this.uFeatureCount-1);
                posY = this.interleaveVisualMap(int(this.aDataFieldId.x), i, j, 1.0,  0.0);
            } else {
                posY = this.aDataFieldId.y / float(this.uFeatureCount-1);
                posX = this.interleaveVisualMap(int(this.aDataFieldId.x), i, j, 1.0,  0.0);
            }
            size = this.interleaveVisualMap(this.uVisualEncodings[5], i, j, 1.0,  0.0);
            color = this.interleaveVisualMap(this.uVisualEncodings[2], i, j, -1.0,  0.0);
            alpha = this.interleaveVisualMap(this.uVisualEncodings[3], i, j, this.uDefaultAlpha, 0.0);

            posX = posX * 2.0 - 1.0;
            posY = posY * 2.0 - 1.0;

            if(color == -1.0)
                rgb = this.uDefaultColor;
            else {
                var t = (float(this.uVisualEncodings[2] - this.uIndexCount) + j) / float(this.uFieldCount);
                var value = texture2D(this.uDataInput, vec2(i, t)).a;
                rgb = this.uColorTable[int(value)+1];
            }
                // rgb = texture2D(this.tColorGraident, vec2(color, 1.0)).rgb;

            this.vColorRGBA = vec4(rgb*alpha, alpha);

            gl_Position = vec4(posX, posY, 0.0, 1.0);
        }

        renderer.fs = function() {
            if(this.vResult == this.uVisLevel)
                gl_FragColor = this.vColorRGBA;
            else
                discard;
        }

        return renderer;
    }
})
