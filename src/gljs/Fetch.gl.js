export function getData({fid = 'int', r = 'float', s = 'float'}) {
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

export function getNonIndexedData({fieldId = 'int', addrX = 'float', addrY = 'float'}) {
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