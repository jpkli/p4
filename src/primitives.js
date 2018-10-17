
export function fetch($int_fid, $float_r, $float_s) {
    var t, value;
    if (fid >= this.uFieldCount + this.uIndexCount) {
        t = (float(fid - this.uFieldCount - this.uIndexCount) + s) /
            float(this.uDeriveCount);
        value = texture2D(this.fDerivedValues, vec2(r, t)).a;
    } else {
        if (this.uIndexCount > 0 && fid == 0) value = this.aDataValx;
        else if (this.uIndexCount > 1 && fid == 1) value = this.aDataValy;
        else {
            t = (float(fid - this.uIndexCount) + s) / float(this.uFieldCount);
            value = texture2D(this.uDataInput, vec2(r, t)).a;
        }
    }
    return value;
}

export function map($float_value) {
    var i, j;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    this.vResult = $(mapFunction.bind(null, value));
}

export function filter($float_value) {
    var i, j;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    result = 1.0;

    for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
        if(this.uFilterControls[f] == 1) {
            value = this.fetch(f, i, j);
            if(value < this.uFilterRanges[f].x || value >= this.uFilterRanges[f].y) {
                result = 0.0;
            }
        }
    }
    this.vResult = $(filterFunction.bind(null, value));
    return result;
}

export function reduce() {
    if (this.vResult == 0.0) discard;
    if (this.uAggrOpt == 2)
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else
        gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
}
