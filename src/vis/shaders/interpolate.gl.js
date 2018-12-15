export default {
  visMap({
    fieldId = 'int',
    addrX = 'float',
    addrY = 'float',
    indexedValue0 = 'float',
    indexedValue1 = 'float',
    defaultValue = 'float',
    exp = 'float'
  }) {
      var value;
      var d = new Vec2();
      if (fieldId > -1) {
          if (fieldId >= this.uIndexCount) {
              value = this.getNonIndexedData(fieldId, addrX, addrY);
          } else if (fieldId < this.uIndexCount) {
              value = (fieldId == 0) ? indexedValue0 : indexedValue1;
          }
          if (exp != 0.0) {
              value = pow(value, exp);
              // if(exp == 5.0) {
              //     value = log(tan( (value / 90.0 + 1.0) * 3.14 / 4.0)) * 180.0 / 3.14;
              // }
          }
          d = this.uVisDomains[fieldId];
          value = (value - d.x) / (d.y - d.x);
      } else {
          value = defaultValue;
      }

      return value;
  }
}