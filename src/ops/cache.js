export default function cache($p) {
    var cache = {},
        dataDimension = $p.uniform.uDataDim.data,
        fieldCount =  $p.uniform.uFieldCount.data,
        cacheTag;

    var vs = $p.shader.vertex(function () {
         gl_Position = vec4(this._square, 0, 1);
    });

    var fs = $p.shader.fragment(function () {
        var x, y;

        x = (gl_FragCoord.x) / this.uDataDim.x;
        y = (gl_FragCoord.y) / (this.uDataDim.y * float(this.uFieldCount));

        gl_FragColor = texture2D(this.uDataInput, vec2(x, y));
    });

    $p.program("cache", vs, fs);

    cache.execute = function(tag) {
        cacheTag = tag;
        dataDimension = $p.uniform.uDataDim.data;
        fieldCount = $p.uniform.uFieldCount.data;
        $p.framebuffer(tag, "float", [dataDimension[0], dataDimension[1] * fieldCount]);
        $p.bindFramebuffer(tag);
        var gl = $p.program("cache");
        gl.viewport(0, 0, dataDimension[0], dataDimension[1] * fieldCount);
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        $p.framebuffer.enableRead(tag);
        $p.uniform.uDataInput = $p.framebuffer[tag].texture;
        $p.getResultBuffer = cache.result;
    }

    cache.result =  function() {
        var gl = $p.ctx;
        $p.bindFramebuffer(cacheTag);
        dataDimension = $p.uniform.uDataDim.data;
        var result = new Float32Array(dataDimension[0]*dataDimension[1]*4*fieldCount);
        gl.readPixels(0, 0, dataDimension[0], dataDimension[1] * fieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        result = result.filter(function(d, i){ return i%4===3;} );

        return result;
    }

    return cache;
}
