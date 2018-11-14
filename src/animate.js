function getValue ({fieldId = 'int', addrX = 'float', addrY = 'float'}){
    var value;
    var d = new Vec2();
    if(fieldId > -1) {
        value = this.getData(fieldId, addrX, addrY);
        d = this.uVisDomains[fieldId];
        value = (value - d.x) / (d.y - d.x);
    } else {
        value = 1.0;
    }
    return value;
};

function getVisProps({x = 'float', y = 'float'}) {
    var posX, posY, size; 
    posX = this.getValue(this.uAnimationEncodings[0], x, y);
    posY = this.getValue(this.uAnimationEncodings[1], x, y);
    size = this.getValue(this.uAnimationEncodings[6], x, y);

    var result = new Vec3();
    result = vec3(posX, posY, size);
    return result;
}

function interpolateVec3({
    v0 = 'vec3',
    v1 = 'vec3',
    dv = 'float'
}) {
    var x, y, z;

    x = v0.x + dv * (v1.x - v0.x);
    y = v0.y + dv * (v1.y - v0.y);
    z = v0.z + dv * (v1.z - v0.z);

    return vec3(x, y, z);
}

function interpolateVec4($vec4_v0, $vec4_v1, $float_dv) {
    var x, y, z, w;

    x = v0.x + dv * (v1.x - v0.x);
    y = v0.y + dv * (v1.y - v0.y);
    z = v0.z + dv * (v1.z - v0.z);
    z = v0.w + dv * (v1.w - v0.w);

    return vec3(x, y, z, w);
}

function getVisColor($float_x, $float_y) {
    var color, opacity;
    var rgb = new Vec3();
    color = this.getValue(this.uAnimationEncodings[2], x, y);
    opacity = this.getValue(this.uAnimationEncodings[3], x, y);
    rgb = this.mapColorRGB(this.uAnimationEncodings[2], color);
    return vec4(rgb, opacity);
}


let vShader  = function() {
    var i0, i1, j, posX, posY;
    var rgb = new Vec3();
    var props = new Vec3();
    var props0 = new Vec3();
    var props1 = new Vec3();

    i0 = (this.aDataIdx+0.5) / this.uDataDim.x;
    i1 = (this.aDataIdx+1.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    if(this.uFilterFlag == 1) {
        this.vResult = texture2D(this.fFilterResults, vec2(i0, j)).a;
    } else {
        this.vResult = this.uVisLevel;
    }
    
    this.vColorRGBA = this.getVisColor(i0, j);
    props0 = this.getVisProps(i0, j);
    props1 = this.getVisProps(i1, j);
    props = this.interpolateVec3(props0, props1, this.uAnimationInterval);
    // props = this.getVisProps(i0, j);
    posX = props[0] * 2.0 - 1.0;
    posY = props[1] * 2.0 - 1.0;
    gl_PointSize = props[2] * this.uMarkSize;
    gl_Position = vec4(posX, posY , 0.0, 1.0);
};

let fShader = function() {
    var valid = new Bool();
    valid = this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01;
    if(this.uVisMark == 1) {
        var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        var delta = 0.15;
        var alpha = this.vColorRGBA.a - smoothstep(0.5-delta, 0.5, dist);
        if(valid) {
            gl_FragColor = vec4(this.vColorRGBA.rgb*alpha, alpha);
        } else {
            discard;
        }
    } else {
        if(valid) {
            gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a,  this.vColorRGBA.a);
        } else {
            discard;
        }
    }
}

export default function($p) {
    $p.uniform('uAnimationInterval', 'float', 0.0);
    $p.uniform('uAnimationEncodings', 'int', $p.uniform.uVisualEncodings.data);

    $p.subroutine('getValue', 'float', getValue);
    $p.subroutine('getVisProps', 'vec3', getVisProps);
    $p.subroutine('getVisColor', 'vec4', getVisColor);
    $p.subroutine('interpolateVec3', 'vec3', interpolateVec3);
    $p.program("animate",
        $p.shader.vertex(vShader),
        $p.shader.fragment(fShader)
    );

    let animation = {
        elapsed : 0,
        interval : 500,
        then : 0,
        step : 0,
        stop: false,
    }

    $p.animation = animation;

    let animate = function(now) {
        if (animation.elapsed > animation.interval) {
            animation.elapsed = 0;
            animation.step += 1;
            console.log(animation.step);
        } else {
            animation.elapsed += now - animation.then; 
        }
        animation.then = now;
        $p.uniform.uAnimationInterval = animation.elapsed / animation.interval;
        if(animation.step <= $p.dataDimension[0] - 1) {
            $p.ctx.ext.drawArraysInstancedANGLE($p.ctx.POINTS, animation.step, 1, $p.dataDimension[1]);
            if(!animation.stop) requestAnimationFrame(animate);

        } else {
            console.log('animation completed with total steps of ' + animation.step)
        }
    }

    animation.start =  function() {
        requestAnimationFrame(animate);
    }

    return function() {
        let gl = $p.program('animate');
        $p.uniform.uAnimationEncodings = $p.uniform.uVisualEncodings.data;
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        animation.start();

        return animation;
    }
}
