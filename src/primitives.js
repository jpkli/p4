define(function(require){
    return function() {
        var primitives = {};

        function retrieve($int_fid, $float_r, $float_s) {
            var t, value;
            if (fid >= this.uFieldCount + this.uIndexCount) {
                t = (float(fid - this.uFieldCount - this.uIndexCount) + s) /
                    float(this.uDeriveCount);
                value = texture2D(this.fDerivedValues, vec2(r, t)).a;
            } else {
                if (this.uIndexCount > 0 && fid == 0) value = this.aIndex0Value;
                else if (this.uIndexCount > 1 && fid == 1) value = this.aIndex1Value;
                else {
                    t = (float(fid - this.uIndexCount) + s) / float(this.uFieldCount);
                    value = texture2D(this.uDataInput, vec2(r, t)).a;
                }
            }
            return value;
        }
    }
})
