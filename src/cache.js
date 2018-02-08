export default function cache(fxgl) {
    var cache = {},
        dataDimension = fxgl.uniform.uDataDim.data,
        fieldCount =  fxgl.uniform.uFieldCount.data,
        cacheTag;

    var vs = fxgl.shader.vertex(function () {
         gl_Position = vec4(this._square, 0, 1);
    });

    var fs = fxgl.shader.fragment(function () {
        var x, y;
        $vec4(value);
        x = (gl_FragCoord.x) / this.uDataDim.x;
        y = (gl_FragCoord.y) / (this.uDataDim.y * float(this.uFieldCount));
        value = texture2D(this.uDataInput, vec2(x, y));
        gl_FragColor = value;
    });

    fxgl.program("cache", vs, fs);

    cache.execute = function(tag, dataDim, fieldTotal) {
        cacheTag = tag;
        dataDimension = dataDim || fxgl.uniform.uDataDim.data;
        fieldCount = fieldTotal || fxgl.uniform.uFieldCount.data;

        console.log(fieldCount);

        fxgl.framebuffer(tag, "float", [dataDimension[0], dataDimension[1]*fieldCount]);
        fxgl.bindFramebuffer(tag);
        var gl = fxgl.program("cache");

        // console.log(dataDimension, fieldCount);
        gl.viewport(0, 0, dataDimension[0], dataDimension[1]*fieldCount);
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        var result = new Float32Array(dataDimension[0]*dataDimension[1]*4*fieldCount);
        gl.readPixels(0, 0, dataDimension[0], dataDimension[1]*fieldCount, gl.RGBA, gl.FLOAT, result);
        console.log(result.filter(function(d, i){ return i%4===3 } ));

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        fxgl.framebuffer.enableRead(tag);
        fxgl.uniform.uDataInput = fxgl.framebuffer[tag].texture;
    }

    cache.result =  function() {
        fxgl.bindFramebuffer(cacheTag);
        var gl = fxgl.program("cache"),
            result = new Float32Array(dataDimension[0]*dataDimension[1]*4*fieldCount);

        gl.readPixels(0, 0, dataDimension[0], dataDimension[1]*fieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return result.filter(function(d, i){ return i%4===0;} );
    }

    return cache;
}
