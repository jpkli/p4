export default {
    visMap({
        channelId = 'int',
        addrX = 'float',
        addrY = 'float',
        indexedValue0 = 'float',
        indexedValue1 = 'float',
        defaultValue = 'float'
    }) {
        var value;
        var d = new Vec2();
        var fieldId = new Int();
        fieldId = this.uVisualEncodings[channelId];
        if (fieldId > -1) {
            if (fieldId >= this.uIndexCount) {
                value = this.getNonIndexedData(fieldId, addrX, addrY);
            } else if (fieldId < this.uIndexCount) {
                value = (fieldId == 0) ? indexedValue0 : indexedValue1;
            }
            d = this.uVisDomains[fieldId];
            value = (value - d.x) / (d.y - d.x);
            if (this.uScaleExponents[channelId] != 0.0) {
                value = pow(value, this.uScaleExponents[channelId]);
            }

            if (this.uGeoProjection == 1) {
                value = log(tan((value / 90.0 + 1.0) * 3.14159 / 4.0)) * 180.0 / 3.14159;
            }
        } else {
            value = defaultValue;
        }

        return value;
    },

    getEncodingByFieldId({
        fieldId = 'int',
        addrX = 'float',
        addrY = 'float'
    }) {
        var value;
        if (fieldId >= this.uIndexCount) {
            value = this.getNonIndexedData(fieldId, addrX, addrY);
        } else if (fieldId < this.uIndexCount) {
            value = (fieldId == 0) ? addrX : addrY;
        }
        var d = new Vec2();
        d = this.uVisDomains[fieldId];
        value = (value - d.x) / (d.y - d.x);
        return value;
    }
}