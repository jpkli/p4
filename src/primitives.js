define(function(require){
    return {
        gather: gather,
        fitler: filter
    }
})


function gather($int_fieldId, $float_addrX, $float_addrY) {
    var offsetY, value;
    if (fieldId >= this.uFieldCount + this.uIndexCount) {
        offsetY = (float(fieldId - this.uFieldCount - this.uIndexCount) + addrY) /
            float(this.uDeriveCount);
        value = texture2D(this.fDerivedValues, vec2(addrX, offsetY)).a;
    } else {
        offsetY = (float(fieldId - this.uIndexCount) + addrY) / float(this.uFieldCount);
        value = texture2D(this.uDataInput, vec2(addrX, offsetY)).a;
    }
    return value;
}

function filter($float_value) {

    var i, j;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    result = 1.0;

    for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
        if(this.uFilterControls[f] == 1) {
            value = this.gather(f, i, j);
            if(value < this.uFilterRanges[f].x || value >= this.uFilterRanges[f].y) {
                result = 0.0;
            }
        }
    }

    return result;
}
