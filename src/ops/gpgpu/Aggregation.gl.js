export const Aggregate = {
  vertexShader() {
    gl_PointSize = 1.0;

    var i, j;
    var groupKeyValue;

    i = (this.aDataIdx + 0.5) / this.uDataDim.x;
    j = (this.aDataIdy + 0.5) / this.uDataDim.y;

    if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
        this.vResult = 0.0;
    } else {
        if(this.uAggrOpt != 2.0) {
            this.vResult = this.getData(this.uFieldId, i, j);
        } else {
            this.vResult = 1.0;
        }
    }

    if (this.uFilterFlag == 1) {
        if (texture2D(this.fFilterResults, vec2(i, j)).a < this.uVisLevel - 0.01) {
            this.vResult = 0.0;
        }
    }

    var pos = new Vec2();
    for (var ii = 0; ii < 2; ii++) {
        var gid = new Int();
        gid = this.uGroupFields[ii];
        if (gid != -1) {
            if (this.uIndexCount > 0) {
                if (gid == 0) {
                    groupKeyValue = i;
                } else if (gid == 1) {
                    groupKeyValue = j;
                }
            }
            if (this.uIndexCount == 0 || gid > 1) {
                var d = new Vec2();
                var w = this.getFieldWidth(gid);
                var value = this.getData(gid, i, j);

                d = this.getFieldDomain(gid);

                if(this.uBinCount[ii] > 0) {
                    value = max(ceil((value - d[0]) / this.uBinIntervals[ii]), 1.0);
                    groupKeyValue = value / float(this.uBinCount[ii]);
                } else {
                    groupKeyValue = (value - d.x) / (d.y - d.x) * w / (w + 1.0);
                    groupKeyValue += 0.5 / w;
                }
            }
            pos[ii] = groupKeyValue * 2.0 - 1.0;
        } else {
            pos[ii] = 0.5;
        }
    }

    gl_Position = vec4(pos, 0.0, 1.0);
  },

  fragmentShader() {
    if (this.vResult == 0.0) discard;
    if (this.uAggrOpt == 2.0)
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    else
        gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
  }
}

export const GetStats = {
  vertexShader() {
    gl_Position = vec4(this._square, 0, 1);
  },

  fragmentShader() {
    var x, y, res;
    $vec4(value);

    if (this.uAggrOpt > 3.0) {
        x = (gl_FragCoord.x) / this.uResultDim.x;
        y = (gl_FragCoord.y) / (uResultDim.y * float(this.uFieldCount));
        value = texture2D(this.uDataInput, vec2(x, y));
        res = value.a / value.b;
    } else {
        res = value.a;
    }
    gl_FragColor = vec4(0.0, 0.0, 0.0, res);
  }
}

export const FillValues = {
  vertexShader() {
    gl_Position = vec4(this._square, 0, 1);
  },

  fragmentShader() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, this.uFillValue);
  }
}
