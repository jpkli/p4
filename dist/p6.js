/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 12);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "int", function() { return int; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "short", function() { return short; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "float", function() { return float; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "double", function() { return double; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "string", function() { return string; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "time", function() { return time; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "temporal", function() { return temporal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "integer", function() { return integer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "numeric", function() { return numeric; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "nominal", function() { return nominal; });
const int      = Int32Array;
const short    = Int16Array;
const float    = Float32Array;
const double   = Float64Array;
const string   = Uint16Array;
const time     = Float64Array;
const temporal = Float64Array;
const integer  = Int32Array;
const numeric  = Float32Array;
const nominal  = Uint16Array;




/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export seq */
/* unused harmony export seqInt */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return seqFloat; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ctypes__ = __webpack_require__(0);


function seq(dtype, start, end, interval) {
    var step = interval || 1,
        size = (end - start) / step + 1,
        buf;

    buf = new __WEBPACK_IMPORTED_MODULE_0__ctypes__[dtype](size);
    for (var i = 0; i < size; i++) {
        buf[i] = start + i * step;
    }
    return buf;
}

let seqInt = seq.bind(null, "int");
let seqFloat = seq.bind(null, "float");


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Uniform;
function Uniform(glContext, name, type, data) {

    var uniform = (this instanceof Uniform) ? this : {},
        ctx = glContext;

    function serializeArray(arrayOfArray) {
        var sa = [];
        arrayOfArray.forEach(function(a){
            sa = sa.concat(a);
        })
        return sa;
    }

    function setUniform() {
        var type = this.type,
            location = this.location,
            size = this.size,
            data = this.data;

        if(Array.isArray(data)) {
            var hasArray = data.filter(function(d){return Array.isArray(d);});
            if(hasArray)
                data = serializeArray(data);
        }

        if((type == 'float' || type == 'int') && !Array.isArray(data) && !ArrayBuffer.isView(data))
            data = [data];

        var buf;
        if (type.slice(0,3) == 'vec' || type == 'float') {
            buf = new Float32Array(data);
            ctx['uniform' + size + 'fv'](location, buf);
        } else if(type.slice(0,4) == 'ivec' || type == 'int'){
            buf = new Int32Array(data);
            ctx['uniform' + size + 'iv'](location, buf);
        } else if(type.slice(0,3) == 'mat') {
            buf = new Float32Array(data);
            ctx['uniformMatrix' + size + 'fv'](location, false, buf);
        } else if(type == 'sampler2D') {
            if(data.hasOwnProperty('resourceType') && data.resourceType == 'texture') {
                ctx.activeTexture(ctx.TEXTURE0 + data.index);
                ctx.bindTexture(ctx.TEXTURE_2D, data.ptr);
                ctx.uniform1i(location, data.index);
            }
        }
    }

    uniform.create = function(name, type, data) {

        if(Array.isArray(data)) {
            var hasArray = data.filter(function(d){return Array.isArray(d);});
            if(hasArray)
                data = serializeArray(data);
        }

        uniform[name] = {
            type: type,
            name: name,
            data: data,
            location: null,
            size: parseInt(type.slice(3,4)) || parseInt(type.slice(4,5)) || 1
        };

        uniform[name].link = function(program) {
            if(typeof this.data !== 'undefined' && this.data !== null) {
                this.location = ctx.getUniformLocation(program, this.name);
                setUniform.call(this);
            }
            return this;
        };

        uniform[name].load = function(data) {
            this.data = data;
            return this;
        };

        uniform[name].header = function() {
            var header = 'uniform ' + this.type + ' ' + this.name,
                len = 0;

            if(this.type != 'sampler2D') {
                len = this.data.length / this.size;
            }

            //TODO: fix declaration for matrix
            if(len > 1 && type != 'mat4') {
                header += '[' + len + ']';
            }
            return header + ';\n';
        };

        return uniform[name];
    }


    return uniform;
}


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Texture;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__uniform__ = __webpack_require__(2);


function Texture(glContext) {

    var texture = (this instanceof Texture) ? this : {},
        ctx = glContext,
        textureID = 0;

    function setTexture(name, texData) {
        var type = ctx[texture[name].type.toUpperCase()],
            format = ctx[texture[name].channel.toUpperCase()],
            width = texture[name].dim[0],
            height = texture[name].dim[1];

        texture[name].data = texData;

        ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, format, width, height, 0, format, type, texData);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
    }

    function updateTexture(name, texData, offset, dim) {
        var type = ctx[texture[name].type.toUpperCase()],
            format = ctx[texture[name].channel.toUpperCase()],
            width = dim[0] || texture[name].dim[0],
            height = dim[1] || texture[name].dim[1];

        ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
        ctx.texSubImage2D(ctx.TEXTURE_2D, 0, offset[0], offset[1], width, height, format, type, texData);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
    }

    // TODO: Add support for texture compression
    // function compressTexture(texData) {
    //
    //     var ext = (
    //       ctx.getExtension("WEBGL_compressed_texture_s3tc") ||
    //       ctx.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
    //       ctx.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc")
    //     );
    //
    //     ctx.compressedTexImage2D(ctx.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT3_EXT, texture[name].dim[0], texture[name].dim[1], 0, texData);
    //     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    //     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    // }

    texture.create = function(name, type, dim, channel, data, sampler) {
        var texIndex = (texture.hasOwnProperty(name)) ? texture[name].index : textureID++;
        texture[name] = {
            name: name,
            index: texIndex,
            type: type || "float",
            dim: dim || [512, 512],
            channel: channel || "alpha",
            data: null,
            location: null,
            sampler: sampler || null,
            ptr: ctx.createTexture()
        };

        // if(data !== null && data.length)
        setTexture(name, data);

        if (texture[name].sampler === null) {
            texture[name].sampler = Object(__WEBPACK_IMPORTED_MODULE_0__uniform__["a" /* default */])(ctx).create(name, 'sampler2D', texture[name]);
        } else {
            texture[name].sampler.data = texture[name];
        }

        texture[name].link = function(program) {
            if (this.data !== null) {
                // ctx.activeTexture(ctx.TEXTURE0 + this.index);
                // ctx.bindTexture(ctx.TEXTURE_2D, this.ptr);
                // this.location = ctx.getUniformLocation(program, this.name);
                // ctx.uniform1i(this.location, this.index);
                if (typeof(this.sampler.data) == 'undefined' || this.sampler.data === null)
                    this.sampler.data = texture[name];

                this.sampler.link(program);
            }
            return this;
        }

        texture[name].load = function(texData) {
            setTexture(this.name, texData);
            return this;
        }

        texture[name].copyFromFBO = function() {
            ctx.bindTexture(ctx.TEXTURE_2D, this.ptr);
            ctx.copyTexImage2D(
                ctx.TEXTURE_2D,
                0,
                ctx.RGBA,
                0,
                0,
                this.dim[0],
                this.dim[1],
                0
            );
            ctx.bindTexture(ctx.TEXTURE_2D, null);
        }

        texture[name].update = function(texData, offset, dim) {
            updateTexture(this.name, texData, offset, dim);
            return this;
        }

        texture[name].resize = function(dim, data) {
            this.dim = dim;
            setTexture(this.name, data);
        }

        texture[name].delete = function() {
            glContext.deleteTexture(this.ptr);
        }

        texture[name].header = function() {
            if (this.name == this.sampler.name)
                return 'uniform sampler2D ' + this.sampler.name + ';\n';
            else
                return '';
        }

        return texture[name];
    }

    return texture;
}


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Shader;
function Shader(glContext, glResource) {
    
    var shader = (this instanceof Shader) ? this : {},
        ctx = glContext,
        resource = glResource,
        parameters = ctx._dict || {};

    shader.vertex = {};
    shader.fragment = {};

    var shaderType = {
        vertex: ctx.VERTEX_SHADER,
        fragment: ctx.FRAGMENT_SHADER
    };

    // Convert JS functions to GLSL codes
    function toGLSL(returnType, name, fn){

        var glsl = returnType + ' ' +
            name + '(' + applyEnvParameters(fn.toString())
            .replace(
                /var\s+([\w|\d]+)\s*=\s*new\s+([\w|\d]+)\((.*)\)/g,
                function(expr, name, dtype, value){
                    var parts;
                    if(value)
                        parts = [dtype.toLowerCase(), name, '=', value];
                    else
                        parts = [dtype.toLowerCase(), name];

                    return parts.join(' ')
                }
            )
            .replace(/for\s*\(\s*var\s+/g, 'for(int ')
            .replace(/var\s/g, 'float ')
            .replace(/this./g, '')
            .replace(/\$(.*)\((.*)\)\s*(=|;)/g, "$1 $2 $3");
            // .replace(/\$(.*?)\./g, "$1 ")

        if(name == "main") {
            glsl = glsl.replace(/function.*\(\s*([\s\S]*?)\s*{/, '){') + "\n";
        } else {
            var args = glsl.match(/function.*\(\s*([\s\S]*?)\s*\)/)[1];

            if(args != "") {
                args = args.replace(/\$([\w|\d]+)_/g, "$1 ");
            }
            glsl = glsl
                .replace(/function.*\(\s*([\s\S]*?)\s*\)/, args+')') + "\n";
        }
        return glsl;
    }

    //set parameters in JS functions before converting to GLSL codes
    function applyEnvParameters(str){
        //find all $(...) and replace them with parameters
        var envParam = Object.keys(parameters);
        if(envParam.length > 0){
            var re = new RegExp("\\$\\(("+envParam.join("|")+")\\)","g");
            str = str.replace(re, function(matched){
                return parameters[matched.slice(2,matched.length-1)];
            });
        }

        // Make uniforms to be used as parameters in shaders, like $(uniformName)
        // var envUniforms = Object.keys(resource.uniform);
        // re = new RegExp("\\$\\(("+envUniforms.join("|")+")\\)","g");
        // str = str.replace(re, function(matched){
        //     return resource.uniform[matched.slice(2,matched.length-1)].data;
        // });

        return str;
    }

    function compile(shaderType, shaderSource) {
        if (shaderType !== ctx.VERTEX_SHADER && shaderType !== ctx.FRAGMENT_SHADER) {
            throw ("Error: unknown shader type");
        }
        var _shader = ctx.createShader(shaderType);
        ctx.shaderSource(_shader, shaderSource);
        ctx.compileShader(_shader);

        // Check the compile status, get compile error if any
        var compiled = ctx.getShaderParameter(_shader, ctx.COMPILE_STATUS);
        if (!compiled) {
            var lastError = ctx.getShaderInfoLog(_shader);
            console.log(shaderSource + '\n ====================================================');
            throw new Error("Error compiling shader '" + _shader + "':" + lastError);

            ctx.deleteShader(_shader);
            return null;
        }

        return _shader;
    }

    function getDeps(fn) {
        var deps = [],
            sourceCode = fn.toString(),
            shaderArgs = sourceCode.match(/function\s.*?\(([^)]*)\)/),
            args = (shaderArgs !== null && shaderArgs.length) ? shaderArgs[1] : [];
        // args = args.replace(/(?:\r\n|\r|\n|\s)/g, '');
        //
        if(args.length) {
            deps = args.split(',').map(function(arg) {
                return arg.replace(/\/\*.*\*\//, '').trim();
            }).filter(function(arg) {
                return arg;
            });
        }

        var extraDeps = getExtraDeps(sourceCode);
        if(extraDeps.length) {
            deps = deps.concat(extraDeps
            .filter(function(d){
                return deps.indexOf(d) === -1;
            }))
        }

        return deps;
    }

    function getExtraDeps(fnString) {
        var extraDeps = fnString.match(/this\.(\w+)/g);
        if(extraDeps !== null) {
            extraDeps = extraDeps.map(function(d){
                return d.slice(5);
            });
        }
        return extraDeps || [];
    }

    function declareDep(dep) {
        var res = resource.get(dep);
        if(typeof res === 'undefined')
            throw new Error('Resource/dependence "' + dep + '" is not found.');
        if(res.resourceType == 'subroutine')
            return toGLSL(res.type, res.name, res.fn);
        else
            return res.header();
    }

    function uniqueDeps(deps) {
        var names = {};
        deps.forEach(function(d, i){
            names[d] = i;
        });

        return Object.keys(names);
    }

    shader.create = function(arg, fn){
        var option = arg || {},
            name = option.name || "default",
            type = option.type || "vertex",
            deps = option.require || option.deps || [],
            precision = option.precision || "high",
            debug = option.debug || false,
            main = option.main || fn || function() {};

        var shaderSource = 'precision ' + precision + 'p float;\n';

        if(deps.length === 0) deps = uniqueDeps(getDeps(main));

        //get dependence from subroutines if any
        var extraDeps = [],
            subRoutines = [];

        deps.forEach(function(dep){
            var res = resource.get(dep);
            if(typeof res == 'undefined') {
                console.log(dep);
                throw Error ('Error! Undefined variable in shader: '+  dep.name);
            }
            if(res.resourceType == 'subroutine') {
                subRoutines.push(res.name);
                var subDeps = getExtraDeps(res.fn.toString());
                if(subDeps.length) {
                    //TODO: make this recursive to check all subroutine deps
                    subDeps.forEach(function(sdep){
                        var sres = resource.get(sdep);
                        if(sres.resourceType == 'subroutine')
                            extraDeps = extraDeps.concat(getExtraDeps(sres.fn.toString()));
                    })

                    extraDeps = extraDeps.concat(subDeps);
                }
            }
        })

        if(extraDeps.length) {
            var allDeps = extraDeps
            // .filter(function(d){
            //     return deps.indexOf(d) === -1;
            // })
            .concat(deps.filter(function(d){
                return subRoutines.indexOf(d) === -1;
            }))
            .concat(subRoutines);

            deps = uniqueDeps(allDeps);
        }


        if(Array.isArray(deps)){
            deps.forEach(function(dep){
                shaderSource += declareDep(dep);
            });
        } else if(typeof(deps) == 'object') {
            Object.keys(deps).forEach(function(resourceType){
                deps[resourceType].forEach(function(dep){
                    shaderSource += declareDep(dep);
                });
            })
        }

        shaderSource += toGLSL('void', 'main', main);
        if(debug)
            console.log(shaderSource);
        var _shader = compile(shaderType[type], shaderSource);
        _shader._shaderType = shaderType[type];
        _shader.deps = deps;
        _shader.source = shaderSource;
        shader[type][name] = _shader;
        return _shader;
    }

    return shader;
}


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = derive;

function derive($p, spec) {

    var derive = {},
        dataDimension = $p.uniform.uDataDim.data,
        deriveMax = $p.uniform.uDeriveCount.data,
        derivedFields = Object.keys(spec);

    var fields = $p.fields;

    var marco = "\t";

    derivedFields.forEach(function(d, i){
        var re = new RegExp("("+fields.join("|")+")","g");
        // var formula = spec[d].replace(/@([\w|\d|_]+)/g, function(matched){
        var formula = spec[d].replace(re, function(matched){
            // console.log(matched);
            var index = fields.indexOf(matched);
            return 'this.getData('  + index + ', pos.x, pos.y)';
        });
        marco += 'if (index == ' + i + ') return ' + formula + "; \n \telse ";
    });

    marco += " return 0.0;"

    $p.uniform("uOptMode", "float", 0)
        .uniform("uDeriveId", "int", 0)
        .subroutine("getDerivedValue", "float", new Function("$int_index", "$vec2_pos", marco));


    function vertexShader() {
        gl_PointSize = 1.0;

        var i, j;

        i = (this.aDataIdx+0.5) / this.uDataDim.x;
        j = (this.aDataIdy+0.5) / this.uDataDim.y;

        this.vResult = this.getDerivedValue(this.uDeriveId, vec2(i, j));
        if(this.uFilterFlag == 1) {
            if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                this.vResult = 0.0;
        }
        var x, y;
        if(this.uOptMode == 0.0){
            x = 0.5;
            y = 0.5;
        } else {
            x = i * 2.0 - 1.0;
            y = j * 2.0 - 1.0;
        }

        gl_Position = vec4(x, y, 0.0, 1.0);
    }

    function fragmentShader() {
        if(this.vResult == 0.0) discard;
        if(this.uOptMode > 0.0 || this.vResult >= 0.0)
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        else
            gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
    }

    var vs = $p.shader.vertex(vertexShader),
        fs = $p.shader.fragment(fragmentShader),
        gl = $p.createProgram("derive", vs, fs);

    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

    function _execute() {

        var gl = $p.program("derive");
        $p.framebuffer.enableRead("fFilterResults");
        $p.bindFramebuffer("fDerivedValues");
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.ONE, gl.ONE );
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

        // $p.uniform.uDeriveCount = deriveFieldCount;
        var deriveDomains = [];
        derivedFields.forEach(function(d, i){
            $p.uniform.uDeriveId = i;
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.viewport(0, 0, 1,  1);

            var result = new Float32Array(8);

            gl.blendEquation(gl.MAX_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

            gl.viewport(1, 0, 1,  1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            gl.blendEquation(gl.MIN_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, result);

            var minValue = (result[4] < 0) ? result[5] : result[7],
                maxValue = (result[2] > 0) ? result[3] : result[1];
            deriveDomains[i] = [minValue, maxValue];

            // deriveDomains[i] = [Math.min(min[0], min[3]), Math.max(max[0], max[3])];
        });
        gl.viewport(0, 0, dataDimension[0], dataDimension[1]*deriveMax);
        gl.disable( gl.BLEND );
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        $p.uniform.uOptMode = 1.0;

        derivedFields.forEach(function(d, i){
            $p.uniform.uDeriveId = i;
            gl.viewport(0, dataDimension[1]*i, dataDimension[0], dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return deriveDomains;
    }

    derive.execute = function(spec) {
        var derivedFields = Object.keys(spec);
        var newDerivedDomains = _execute();
        if(!$p._update) {
            newDerivedDomains.forEach(function(d, i) {
                var fieldId = $p.fields.indexOf(derivedFields[i]);
                if(fieldId === -1) {
                    $p.fields.push(derivedFields[i]);
                    fieldId = $p.fields.indexOf(derivedFields[i]);
                    $p.deriveCount += 1;
                }

                $p.fieldDomains[fieldId] = d;
                $p.fieldWidths[fieldId] = d[1] - d[0] + 1;
            });

            $p.uniform.uFieldDomains.data = $p.fieldDomains;
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
    }

    derive.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            fid = options.fieldId || options.deriveFieldId || 0,
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        var result = new Float32Array(rowSize * colSize * 4);
        gl.readPixels(0, dataDimension[1]*fid, rowSize, colSize, gl.RGBA, gl.FLOAT, result);
        return result.filter(function(d, i){ return i%4===3;} ); //return channel alpha in rgba
    }

    return derive;
}


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = reveal;

function reveal($p) {
    var viewport = $p.viewport,
        padding = $p.padding;

    $p.uniform('uRevealMode', 'int', 1)
        .framebuffer("offScreenFBO", "float", $p.viewport)
        .framebuffer("visStats", "float", [1, 1]);

    var aViewX = new Float32Array($p.viewport[0]).map((d, i) => i);
    var aViewY = new Float32Array($p.viewport[1]).map((d, i) => i);

    $p.attribute("aViewX", "float", aViewX)
        .attribute("aViewY", "float", aViewY);

    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewX.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewY.location, 1);

    var vs = $p.shader.vertex(function(){
        var i, j;
        i = (this.aViewX+0.5) / this.uViewDim.x;
        j = (this.aViewY+0.5) / this.uViewDim.y;
        this.vColorRGBA = texture2D(this.offScreenFBO, vec2(i, j));
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    });

    var fs = $p.shader.fragment(function() {
        gl_FragColor = this.vColorRGBA;
    });

    $p.program("post-processing", vs, fs);

    var vs2 = $p.shader.vertex(function () {
         gl_Position = vec4(this._square, 0, 1);
    });

    var fs2 = $p.shader.fragment(function() {
        var x, y, a;
        var value = new Vec4();
        x = (gl_FragCoord.x+0.5) / this.uViewDim.x;
        y = (gl_FragCoord.y+0.5) / this.uViewDim.y;
        value = texture2D(this.offScreenFBO, vec2(x, y));

        if(value.a == 0.0) discard;
        // a = pow(((value.a - this.uDefaultAlpha) / (this.uMaxRGBA.a -this.uDefaultAlpha)), 0.33) * 0.85 + 0.15;
        a = pow((value.a / this.uMaxRGBA.a), 0.33) * 0.9 + 0.1;
        // a = value.a / this.uMaxRGBA.a;

        if(this.uRevealMode == 0) {
            gl_FragColor = vec4(this.uDefaultColor*a, a);
        } else {
            gl_FragColor = vec4(texture2D(this.tColorGraident, vec2(1.-a, 1.0)).rgb*this.uDefaultAlpha, this.uDefaultAlpha);
        }
    });

    $p.program("vis-render", vs2, fs2);

    return function(options) {
        var gl,
            viewIndex = options.viewIndex,
            viewDim = options.dim,
            offset = options.offset || [0, 0],
            padding = options.padding || {left: 0, right: 0, left: 0, right:0};

        if(!$p._update) {
            $p.framebuffer("visStats", "float", [1, 1]);
            gl = $p.program("post-processing");
            $p.framebuffer.enableRead("offScreenFBO");
            $p.bindFramebuffer("visStats");
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewX.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewY.location, 1);
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MAX_EXT);
            gl.viewport(0, 0, 1, 1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0,  viewDim[0], viewDim[1]);

            var max = new Float32Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);
            if(max[3] == 0) {
                max[3] = Math.sqrt($p.dataSize) * Math.log2($p.dataSize);
            }
            $p.views[viewIndex].maxRGBA = max;
        }

        $p.uniform.uMaxRGBA = $p.views[viewIndex].maxRGBA;

        $p.bindFramebuffer(null);
        gl = $p.program("vis-render");
        gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
        $p.framebuffer.enableRead("offScreenFBO");

        gl.viewport(
            offset[0] + padding.left,
            offset[1] + padding.bottom,
            viewDim[0] - padding.left - padding.right,
            viewDim[1] - padding.top - padding.bottom
        );
        // gl.blendEquation(gl.FUNC_ADD);
        gl.disable( gl.BLEND );
        // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = interact;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__metavis_brush__ = __webpack_require__(36);


function interact($p, options) {
    var viewTags = options.view || [$p.views[0].id];

    if(!Array.isArray(viewTags)) viewTags = [viewTags];

    var actions = options.actions || options.events || [],
        condition = options.condition || {},
        callback = options.callback || function() {};

    if($p._update) return;

    viewTags.forEach(function(viewTag){
        var vis = $p.views.filter(v=>v.id == viewTag)[0];

        if(!Array.isArray(actions)) {
            actions = [actions];
        }
        var vmap = vis.vmap,
            p = vis.padding || $p.padding,
            w = vis.width - p.left - p.right,
            h = vis.height - p.top - p.bottom;

        var interactor = vis.chart.svg.append("g")
                .attr("class", "selector")

        var rect = interactor.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "none");

        var svg = interactor.svg,
            box = rect.svg.getBoundingClientRect();

        var sx, sy,
            tx = 0, ty = 0,
            dy = 1;

        function updatePos(e) {
            tx += (e.clientX - sx) / dy;
            ty += (e.clientY - sy) / dy;
            sx = e.clientX;
            sy = e.clientY;
            $p.uniform.uPosOffset.data = [tx / w, ty / h];
        }

        function getSelection(e) {
            var dx = e.clientX - box.left;
            var dy = e.clientY - box.top;
            var selection = {};
            if(vmap.x) {
                selection[vmap.x] = [vis.chart.x.invert(dx)];
            }
            if(vmap.y) {
                selection[vmap.y] = [vis.chart.y.invert(dy)];
            }
            return selection;
        }

        actions.forEach(function(action){
            if(action == 'brush') {
                svg.style.cursor = "crosshair";
                var brushOptions = {
                    container: interactor,
                    width: w,
                    height: h
                };

                if(!Array.isArray(vmap.x) && !Array.isArray(vmap.y)) {
                    if(!condition.x && !condition.y) {
                        condition.x = condition.y = true;
                    }
                    brushOptions.brush = function(d) {
                        var selection = {};
                        if(vmap.x && d.x) selection[vmap.x] = d.x;
                        if(vmap.y && d.y) selection[vmap.y] = d.y.reverse();
                        callback(selection);
                    }
                    if(condition.x && typeof(vis.chart.x.invert) == 'function')
                        brushOptions.x = vis.chart.x.invert;

                    if(condition.y && typeof(vis.chart.y.invert) == 'function')
                        brushOptions.y = vis.chart.y.invert

                    new __WEBPACK_IMPORTED_MODULE_0__metavis_brush__["a" /* default */](brushOptions);
                }

                var dims = ['x', 'y'],
                    selections = {};

                dims.forEach(function(dim){
                    if(Array.isArray(vmap[dim]) && Array.isArray(vis.chart[dim])){
                        var axisDist = (dim == 'x') ? h : w,
                            selectors = vis.chart.svg.append('g');

                        axisDist =  axisDist / (vmap[dim].length-1);

                        vmap[dim].forEach(function(d, i) {

                            var axisSelect = selectors.append("g");
                            if(dim == 'x') {
                                brushOptions.height = axisDist * 0.2;
                                axisSelect.translate(0, axisDist * (i - 0.1));
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim];
                                    callback(selections);
                                }
                            } else {
                                brushOptions.width = axisDist * 0.2;
                                axisSelect.translate(axisDist * (i - 0.1), 0);
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim].reverse();
                                    callback(selections);
                                }
                            }
                            brushOptions.container = axisSelect;
                            brushOptions[dim] = vis.chart[dim][i].invert;

                            new __WEBPACK_IMPORTED_MODULE_0__metavis_brush__["a" /* default */](brushOptions);
                        });
                    }
                })
            } else if(action == 'zoom') {
                svg.onmousewheel = function(e) {
                    sx = e.clientX - box.left;
                    sy = e.clientY - box.top;
                    var ny =  dy * Math.exp(e.deltaY / 1000);
                    var delta = ny - dy;
                    dy = ny;
                    $p.uniform.uPosOffset.data = [-sx * delta / w, -sy * delta / h];
                    $p.uniform.uVisScale.data = [dy, dy];

                    callback();
                }

            } else if(action == 'pan') {
                svg.style.cursor = 'move';
                svg.onmousedown = function(e) {
                    sx = e.clientX;
                    sy = e.clientY;
                    svg.style.cursor = 'move';

                    svg.onmousemove = function(e) {
                        tx += (e.clientX - sx) / dy;
                        ty += (e.clientY - sy);

                        callback();
                    }

                    svg.onmouseup = function(e) {
                        updatePos(e);
                        svg.style.cursor = 'default';
                        svg.onmousemove = null;
                        svg.onmouseup = null;
                    }
                }

            } else if(action == 'click') {
                svg.onclick = function(e) {
                    callback(getSelection(e));
                }
            } else if(action == 'hover') {
                svg.onmouseover = function(e) {
                    callback(getSelection(e));
                    svg.onmousemove = function(e) {
                        callback(getSelection(e));
                    }

                    // svg.onmouseout = function(e) {
                    //     updatePos(e);
                    //     svg.style.cursor = 'default';
                    //     svg.onmousemove = null;
                    //     svg.onmouseover = null;
                    // }
                }
            }
        })
    })
}


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Svg;
function setAttr(elem, attr) {
    for( var key in attr ){
        var value = attr[key],
            c = key.match(/[A-Z]/);
        if(c !== null) key = key.replace(c[0], "-"+c[0].toLowerCase())
        elem.setAttribute(key, value);
    }
}

function setStyle(elem, style) {
    for( var key in style ){
        var value = style[key],
            c = key.match(/[A-Z]/);
        if(c !== null) key = key.replace(c[0], "-"+c[0].toLowerCase())
        elem.style[key] = value;
    }
}

function Svg(arg){
    'use strict';
    var self = (this instanceof Svg) ? this: {},
        option = arg || {},
        type = option.type || 'svg',
        svgNS = 'http://www.w3.org/2000/svg',
        svg = document.createElementNS(svgNS, type),
        width = option.width || 400,
        height = option.height || 300,
        parent = option.parent || option.container || this.parent,
        attr = option.attr || {},
        style = option.style || {},
        padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0};

    if(type === 'svg') {
        var defaultAttr = {
            width   : width + padding.left + padding.right,
            height  : height + padding.top + padding.bottom,
            viewBox : [0, 0, width + padding.left + padding.right , height + padding.top + padding.bottom].join(' '),
            preserveAspectRatio: 'none'
        };
        setAttr(svg, defaultAttr);
    }

    self.innerWidth = function() {
        return width;
    }

    self.innerHeight = function() {
        return height;
    }

    self.padding = function() {
        return padding;
    }

    if(style) setStyle(svg, style);
    if(attr) setAttr(svg, attr);

    if(parent) {
        parent = (typeof parent == "string") ? document.getElementById(parent) : parent;
        parent.appendChild(svg);
    }

    self.svg = svg;
    self.parent = parent;

    if(self instanceof Svg)
        publicMethods(Svg.prototype);
    else
        publicMethods(self);

    return self;
};

function publicMethods(context) {
    context.append = function(type, attr, style) {
        var options = {};
        options.parent = this.svg;
        options.type = type;
        options.attr = attr;
        options.style = style;
        return new Svg(options);
    };

    context.remove = function() {
        this.parent.removeChild(this.svg);
    };

    context.attr = function(a, v) {
        if(typeof(a) == "object")
            setAttr(this.svg, a);
        else
            this.svg.setAttribute(a, v);

        return this;
    }

    context.Attr =  function(a, v) {
        setAttr(this.svg, a);
        return this;
    }

    context.Style =  function(a, v) {
        setStyle(this.svg, a);
        return this;
    }

    context.style = function(a, v) {
        if(typeof(a) == "object")
            setStyle(this.svg, a);
        else
            this.svg.style[a] = v;

        return this;
    }

    context.css = context.style;

    context.text = function(str){
        this.svg.appendChild(document.createTextNode(str));
        return this;
    };

    context.translate = function(x, y) {
        var p = this.svg.getAttribute("transform") || "";
        this.svg.setAttribute("transform", p + "translate(" + [x,y].join(",") + ") ");
        return this;
    };

    context.on = function(event, callback) {
        this.svg.addEventListner(event, callback);
        return this;
    }

    return context;
}


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = axis;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__scale__ = __webpack_require__(10);


function axis(arg) {

    var option      = arg || {},
        svg         = option.container || option.parent,
        dim         = option.dim || "x",
        color       = option.color || "#000",
        position    = option.position || 0,
        align       = option.align || "",
        scale       = option.scale || "linear",
        exponent    = option.exponent || 1,
        metric      = option.metric || null,
        domain      = option.domain || [0,1],
        width       = option.width || svg.innerWidth(),
        height      = option.height || svg.innerHeight(),
        padding     = option.padding || svg.padding() || {left: 0, right: 0, top: 0, bottom: 0},
        range       = option.range || (dim == "x") ? [0, width] : [height, 0],
        styles      = {stroke: color, 'stroke-width': 1},
        ticks       = option.ticks,
        tickLength  = option.tickLength || 6,
        tickPosition = option.tickPosition || false,
        tickInterval= option.tickInterval || "auto",
        tickAlign = option.tickAlign || "center",
        skipLast = option.skipLast || false,
        tickFormat  = option.tickFormat || null,
        grid        = option.grid,
        format      = option.format || function(_){return _;},
        visable    = option.visable || true,
        domainIntervals,
        labelPos    = null,
        labelAngle  = option.labelAngle || 0,
        X = [],
        Y = [];

    if(typeof(ticks) != "number") {
        ticks = (dim == "x") ? Math.ceil(width/50) : Math.ceil(height/50);
    }
    var tickLabelAlign = option.tickLabelAlign || "end";
    switch (align) {
        case "left" || "center":
            labelPos = option.labelPos || {x: -tickLength/2, y: -5};
            tickLabelAlign =  option.tickLabelAlign ||"end";
            break;
        case "right":
            labelPos = {x: tickLength, y: -5};
            tickLabelAlign = option.tickLabelAlign || "start";
            if(!tickPosition) tickPosition = [ tickLength/2, 0];
            break;
        case "top":
            labelPos = {x: 0, y: 0};
            tickLabelAlign = "middle";
            if(!tickPosition) tickPosition = [0, -tickLength];
            break;
        case "bottom" || "middle":
            labelPos = option.labelPos || {x: 0, y: -tickLength*3};
            tickLabelAlign =  option.tickLabelAlign || "middle";
            break;
        default:
            labelPos = option.labelPos || option.labelPosition || {x: 0, y: 0};
            break;
    }
    if(!tickPosition) tickPosition = [0,0];

    function getTickInterval(){
        var vDomain = Math.abs(domain[1] - domain[0]),
            intv = vDomain / ticks,
            pow = Math.ceil(Math.log10(intv)),
            intv = intv / Math.pow(10, pow);

        if(intv > 0.2 && intv <= 0.25){
            intv = 0.25;
        } else if(intv > 0.7 && intv <= 0.75) {
            intv = 0.75;
        } else {
            intv = Math.ceil(intv * 10) / 10;
        }
        return intv * Math.pow(10, pow);
    }


    if (scale == "categorical" || scale == "ordinal") {
        domainIntervals = function() {
            var len = domain.length,
                step = Math.ceil(len / ticks),
                intervals = [],
                i;
            for(i = 0; i < len; i += step) {
                intervals.push(domain[i])
            }
            // if(intervals[i] != domain[len-1]) intervals.push(domain[len-1]);

            return intervals;
        };
    } else {
        var intv;

        if(tickInterval == "auto"){
            intv = getTickInterval();

        } else {
            if(typeof(tickInterval) == "number") {
                intv = tickInterval;
            } else {
                // intv = Math.abs(domain[1] - domain[0]) / ticks;
                intv = getTickInterval();
                domain[0] = intv * Math.floor(domain[0]/intv);
                domain[1] = intv * Math.ceil(domain[1]/intv);
            }
        }

        domainIntervals = function() {
            var di = [];

            if(domain[0] > domain[1]) {
                domain[0] += intv;
                for(var i = domain[0]; i > domain[1]; i=i-intv)
                    di.push(i);
            } else {
                for(var i = domain[0]; i < domain[1]; i=i+intv)
                    di.push(i);
            }

            if(di[di.length-1]!=domain[1] && !isNaN(domain[1]) && !skipLast){

                if((domain[1] - di[di.length-1]) < 0.4 * intv)
                    di[di.length-1] = domain[1];
                else
                    di.push(domain[1]);
            }
            return di;
        }
    }

    if (metric === null) {

        var scaleOptions = {
            align: tickAlign,
            type: scale,
            domain: domain,
            range: range
        };

        if(scale == "power") {
            scaleOptions.exponent = exponent;
        }

        metric = Object(__WEBPACK_IMPORTED_MODULE_0__scale__["a" /* default */])(scaleOptions)
    } else {
        domain = metric.domain();
    }

    var axis = svg.append("g");

    if(dim == 'x') {
        if(!position && align) {
            position = [0,height/2,height];
            position = position[["top", "middle", "bottom"].indexOf(align)];
        }
        Y[0] = Y[1] = position;
        X[0] = 0;
        X[1] = Math.abs(range[1] - range[0]);
    } else {
        if(!position && align) {
            position = [0, width/2, width];
            position = position[["left", "center", "right"].indexOf(align)];
        }
        X[0] = X[1] = position;
        Y[0] = 0;
        Y[1] = Math.abs(range[1] - range[0]);
    }

    metric.show = metric.axis = function() {
        axis.append("g")
            .append("line")
            .Attr({x1: X[0], x2: X[1], y1: Y[0], y2: Y[1]})
            .Style(styles);

        var di = domainIntervals();

        for(var i = 0; i < di.length; i++) {
            var x1,x2,y1,y2;
            if(dim == 'x'){
                x1 = x2 = metric(di[i]) + tickPosition[0];
                y1 = position + tickPosition[1] + tickLength;
                y2 = y1 - tickLength;
            } else {
                if(scale == "categorical" || scale == "ordinal")
                    y1 = y2 = height - metric(di[i]);
                else
                    y1 = y2 = metric(di[i]) + tickPosition[1];
                x1 = position + tickPosition[0] ;
                x2 = x1 - tickLength;
            }

            var svgTicks = axis.append("g");
            svgTicks.append("line", {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2,
            }, styles);


            // if (dim == 'x') tickLabelAlign = "middle";
            // if (dim == 'x' && labelAngle) tickLabelAlign = "end";

            var tickLabel = svgTicks.append("text")
                .Attr({
                    x: x2 + labelPos.x,
                    y: y2 - labelPos.y,
                    // class: "labels",
                    class: "i2v-axis-label",
                    "font-size": "0.9em",
                    textAnchor: tickLabelAlign
                });
            if(labelAngle) tickLabel.attr("transform", "rotate(" + [labelAngle, (x2 + labelPos.x), (y2 - labelPos.y)].join(",")+")");

            var labelText = (typeof(tickFormat) == "function") ? format(tickFormat(di[i])) : format(di[i]) ;
            // tickLabel.appendChild( document.createTextNode(labelText) );
            tickLabel.text(labelText);

            if(grid) {
                var gx1, gx2, gy1, gy2;
                if(dim == 'x'){
                    gx1 = gx2 = metric(di[i]);
                    gy1 = 0;
                    gy2 =height;
                } else {
                    gy1 = gy2 = metric(di[i]);
                    gx1 = 0;
                    gx2 = width;
                }
                axis.append("line",
                    {
                        x1: gx1,
                        x2: gx2,
                        y1: gy1,
                        y2: gy2,
                        class: "grid-lines"
                    },
                    {
                        "stroke": color,
                        // "stroke-width": 0.5,
                        "stroke-opacity": 0.33
                    });
            }
        }
        axis.translate(padding.left, padding.top);
        return axis;
    };

    metric.remove = function() {
        axis.remove();
    }

    if(visable) {
        metric.svg = metric.show();
    }

    return metric;
};


/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Scale;
function Scale(arg) {
    var option = arg || {},
        align = option.align || 'center',
        type = option.type || 'linear',
        domain = option.domain || [0,1],
        margin = option.margin || 0,
        exponent = option.exponent || 1,
        range = option.range || [0,1];

    function getInterpolateFunction() {
        //intercepts and slopes for domain and range
        var d0 = -domain[0] / (domain[1] - domain[0]),
            d1 = 1 / (domain[1] - domain[0]),
            r0 = range[0],
            r1 = range[1] - range[0];

        if(type == "linear") {
            return function(v) { return r0 + (d0 + v * d1) * r1 };
        } else if(type == "power") {
            d0 = -Math.pow(-d0, exponent);
            d1 = Math.pow(d1, exponent);
            return function(v) { return r0 + (d0 + Math.pow(v, exponent) * d1) * r1 };
        } else if (type == "log") {
            exponent = option.exponent || 10;
            d0 = -(Math.log(-d0) / Math.log(exponent));
            d1 = (Math.log(d1) / Math.log(exponent));

            return function(v) { return r0 + (d0 + Math.log(v) / Math.log(exponent) * d1) * r1 };

        } else if(type == "ordinal" || type == "categorical") {
            return function(v) {
                if(align == 'outer')
                    return r0 + (domain.indexOf(v)) / (domain.length-1) * r1;
                else
                    return r0 + (domain.indexOf(v)+0.5) / domain.length * r1;
            };
        } else {
            return function(v) { return v };
        }
    }

    var scale = getInterpolateFunction();

    scale.interval = function(ticks) {
        if (type == "ordinal" || type == "categorical") {
            return (1 / domain.length * Math.abs(range[1] - range[0]));
        } else {
            var s = Math.pow(10, Math.floor(Math.log10(Math.abs(range[1] - range[0])))-1);
            return Math.floor( Math.abs(range[1] - range[0]) / (ticks * s) )  * s;
        }
    };

    scale.domainLength = function() {
        if(type == "linear")
            return Math.abs(domain[1] - domain[0]);
        else if(type == "ordinal" || type == "categorical")
            return domain.length;
    };

    scale.rangeLength = function() {
        return Math.abs(range[1] - range[0]);
    };

    scale.invert = function(r) {
        if(type == "linear") {
            return domain[0] + (r - range[0]) / (range[1] - range[0]) * (domain[1] - domain[0]);
        } else if(type == "ordinal" || type == "categorical") {
            var intv = intv = r / scale.rangeLength();
            return domain[Math.floor(intv * (domain.length))];
        }
    }

    scale.domain = function() {
        return domain;
    }

    return scale;
};


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = printformat;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__arrays__ = __webpack_require__(39);


function printformat(spec) {
    return function(value){
        if(typeof value !== "number") return value;
        var ret,
            convert,
            numericSymbols = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M','G', 'T', 'P', 'E', 'Z', 'Y'],
            n = Object(__WEBPACK_IMPORTED_MODULE_0__arrays__["a" /* seq */])(-24,24,3),
            i = numericSymbols.length-1,
            parts,
            precision = spec.match(/\d+/)[0] || 3,
            number = Number(value),
            exp,
            suffix;

        if(spec[spec.length-1] == 's')
            precision--;

        parts = number.toExponential(precision).toString().match(/^(-{0,1})(\d+)\.?(\d*)[eE]([+-]?\d+)$/);
        exp = parseInt(parts[4]) || 0;

        while (i--) {
            if (exp >= n[i]) {
                if(i==7 && (exp-n[i]) > 1) {
                    // console.log(exp-n[i]);
                    suffix = numericSymbols[i+1];
                    exp -= n[i+1];
                    break
                } else {
                    suffix = numericSymbols[i];
                    exp -= n[i];
                    break;
                }
            }
        }
        ret = parseFloat(parts[1] + parts[2] + '.' + (parts[3]||0) + 'e' + exp.toString());
        return ret.toString() + suffix;
    }
}


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_pipeline__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__src_cstore__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__src_ctypes__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__src_ajax__ = __webpack_require__(42);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__src_parse__ = __webpack_require__(43);






var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p6 = __WEBPACK_IMPORTED_MODULE_0__src_pipeline__["a" /* default */];
root.p6.ajax = __WEBPACK_IMPORTED_MODULE_3__src_ajax__;
root.p6.cstore = __WEBPACK_IMPORTED_MODULE_1__src_cstore__["a" /* default */];
root.p6.ctypes = __WEBPACK_IMPORTED_MODULE_2__src_ctypes__;
root.p6.parse = __WEBPACK_IMPORTED_MODULE_4__src_parse__["a" /* default */];



/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(13)))

/***/ }),
/* 13 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = pipeline;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__allocate__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__output__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__init__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__compile__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__derive__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__interact__ = __webpack_require__(7);







function pipeline(options) {
    var pipeline = {},
        registers = {},
        profiles  = [],
        operation = {},
        response = {},
        optID = 0;

    var $p = Object(__WEBPACK_IMPORTED_MODULE_2__init__["a" /* default */])(options);
    $p.views = [];
    $p.interactions = [];
    
    $p.visualization = null;
    $p.deriveMax = options.deriveMax || 4;
    $p._responseType = 'unselected';
    $p._update = false;

    $p.getResult = function() {};

    function addToPipeline(opt, arg) {
        if( !$p._update) {
            var spec = {};
            spec[opt] = arg;
            $p.pipeline.push(spec);
            return optID++;
        } else {
            return -1;
        }
    }

    pipeline.data = function(dataOptions) {
        Object(__WEBPACK_IMPORTED_MODULE_0__allocate__["a" /* default */])($p, dataOptions);
        operation = Object(__WEBPACK_IMPORTED_MODULE_3__compile__["a" /* default */])($p);
        if(!$p.hasOwnProperty('fieldDomains')) {
            var dd = operation.extent($p.fields.map((f, i) => i), $p.dataDimension);
            console.log(dd);
            $p.uniform.uFieldDomains.data = $p.fieldDomains;
        }
        $p.opt = operation;
        pipeline.ctx = $p.ctx;
        pipeline.register('__init__');
        return pipeline;
    }

    pipeline.view = function(views) {
        $p.views.forEach(function(v){
            if(v.hasOwnProperty('chart')) {
                v.chart.svg.remove();
                delete v.chart;
            }
            if(!v.hasOwnProperty('padding')) {
                v.padding = {left: 30, right: 30, top: 30, bottom: 30};
            }
        })
        $p.views = views;
    }

    pipeline.register = function(tag) {
        registers[tag] = {
            indexes: $p.indexes,
            dataSize: $p.dataSize,
            fields: $p.fields,
            dataDim: $p.uniform.uDataDim.data.slice(),
            fieldWidths: $p.fieldWidths.slice(),
            fieldDomains: $p.fieldDomains.slice(),
            deriveCount: $p.deriveCount,
            filterFlag: $p.uniform.uFilterFlag.data,
            filterControls: $p.uniform.uFilterControls.data.slice(),
            dataInput: $p.uniform.uDataInput.data,
            attribute: {
                aDataIdx: {
                    ids: $p.attribute.aDataIdx.data,
                    value: $p.attribute.aDataValx.data
                },
                aDataIdy: {
                    ids: $p.attribute.aDataIdy.data,
                    value: $p.attribute.aDataValy.data
                },
                aDataFieldId: $p.attribute.aDataFieldId.data,
                aDataItemId: $p.attribute.aDataItemId.data
            }
        }
        return pipeline;
    }

    pipeline.resume = function(tag) {
        addToPipeline('resume', tag);
        if (!registers.hasOwnProperty(tag))
            throw new Error('"' + tag + '" is not found in regesters.');

        var reg = registers[tag];
        // console.log('************* resume to ', tag, reg);
        //resume CPU registers
        $p.indexes = reg.indexes;
        $p.dataSize = reg.dataSize;
        $p.deriveCount = reg.deriveCount;
        $p.fieldCount = reg.fields.length - reg.indexes.length - reg.deriveCount;
        $p.fields = reg.fields.slice();
        $p.fieldWidths = reg.fieldWidths.slice();
        $p.fieldDomains = reg.fieldDomains.slice();
        $p.dataDimension = reg.dataDim.slice();

        //resume GPU Uniforms
        $p.uniform.uFieldCount.data = $p.fieldCount;
        $p.uniform.uDataSize.data = $p.dataSize;
        $p.uniform.uDataDim.data = reg.dataDim;
        $p.uniform.uIndexCount.data = reg.indexes.length;
        $p.uniform.uFieldDomains.data = reg.fieldDomains;
        $p.uniform.uFieldWidths.data = reg.fieldWidths;
        $p.uniform.uFilterFlag.data = reg.filterFlag;
        // $p.uniform.uFilterControls.data = reg.filterControls;
        $p.uniform.uDataInput.data = reg.dataInput;

        //resume GPU Attribute Buffers
        $p.attribute['aDataIdx'] = reg.attribute['aDataIdx'].ids;
        $p.attribute['aDataIdy'] = reg.attribute['aDataIdy'].ids;
        $p.attribute['aDataValx'] = reg.attribute['aDataIdx'].value;
        $p.attribute['aDataValy'] = reg.attribute['aDataIdy'].value;
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdy'].location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValy'].location, 1);

        $p.attribute['aDataFieldId'] = reg.attribute['aDataFieldId'];
        $p.attribute['aDataItemId'] = reg.attribute['aDataItemId'];

        return pipeline;
    }

    pipeline.bin = function (spec) {
        var deriveSpec = {},
            binAttr,
            binCount;

        if (typeof spec == 'object') {
            binAttr = Object.keys(spec)[0];
            binCount = spec[binAttr];
        } else {
            binAttr = spec;
            //Apply Sturges' formula for determining the number of bins
            binCount = Math.ceil(Math.log2($p.dataSize)) + 1;
        }

        var binDomain = $p.fieldDomains[$p.fields.indexOf(binAttr)];
        var binInterval = (binDomain[1] - binDomain[0]) / binCount;

        var histFunction = (function() {max(ceil((binAttr - binMin) / float(binInterval)), 1.0) })
            .toString()
            .slice(13, -1) // remove "function () {" from function.toString
            .replace('binAttr', binAttr)
            .replace('binMin', binDomain[0] + '.0')
            .replace('binInterval', binInterval)

        deriveSpec['bin@'+binAttr] = histFunction;
        $p.intervals[binAttr] = {};
        $p.intervals[binAttr].dtype = 'historgram';
        $p.intervals[binAttr].interval = binInterval;
        $p.intervals[binAttr].min = binDomain[0];
        $p.intervals[binAttr].max = binDomain[1];
        $p.intervals[binAttr].align = 'right';
        pipeline.derive(deriveSpec);
        // var deriveFields = $p.fields.slice(-$p.deriveCount),
        //     dfid = deriveFields.indexOf('bin@'+binAttr);
        // $p.deriveDomains[dfid] = [stats[binAttr].min, stats[binAttr].max];
        return 'bin@'+binAttr;
    }

    pipeline.aggregate = function(spec) {
        if(spec.$bin) {
            spec.$group = pipeline.bin(spec.$bin);
            delete spec.$bin;
        }

        addToPipeline('aggregate', spec);
        if(Object.keys($p.crossfilters).length)
            $p.uniform.uFilterFlag = 1;

        operation.aggregate.execute(spec);
        // console.log(JSON.stringify(pipeline.result('row')));
        return pipeline;
    }

    pipeline.filter = function(spec) {
        addToPipeline('filter', spec);
        operation.match.execute(spec);
        $p.getResult = operation.match.result;
        return pipeline;
    }

    pipeline.match = pipeline.filter;

    pipeline.derive = function(spec) {
        addToPipeline('derive', spec);

        //TODO: support JS function as expression for deriving new variable
        //.replace(/function\s*[\w|\d]+\s*\((.+)\)/g, "$1")
        // if (!opt.hasOwnProperty('derive')) {
            operation.derive = Object(__WEBPACK_IMPORTED_MODULE_4__derive__["a" /* default */])($p, spec);
        // }
        operation.derive.execute(spec);
        $p.getResult = operation.derive.result;
        return pipeline;
    }

    pipeline.cache = function(tag) {
        operation.cache.execute(tag);
        return pipeline;
    }

    pipeline.clear = function() {
        console.log($p.visLayers);
    }

    pipeline.read = function() {
        console.log("Read>>", $p.getResult());
        return pipeline;
    }

    pipeline.result = Object(__WEBPACK_IMPORTED_MODULE_1__output__["a" /* default */])($p);

    pipeline.output = function(callback) {
        addToPipeline('output', callback);
        callback(pipeline.result('row'));
        return pipeline;
    }

    var branchID = 0;
    pipeline.branch = function(branches) {
        pipeline.register('_branch'+branchID);
        branches.forEach(function(b){
            var operations = Object.keys(b).map(function(o) {
                var obj = {};
                obj[o] = b[o];
                return obj;
            });
            pipeline.run(operations);
            pipeline.resume('_branch' + branchID);
        })
        branchID++;
    }

    $p.readResult = pipeline.result;

    pipeline.getResult = function (d) {
        return $p.getResult(d);
    }

    pipeline.readPixels = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        $p.bindFramebuffer(null);
        var gl = $p.ctx,
            result = new Uint8Array(rowSize * colSize * 4);

        gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, result);
        return result.filter(function(d, i){ return i%4===3;} );
    }

    pipeline.clearViews = function() {
        $p.bindFramebuffer("offScreenFBO");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer("visStats");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer(null);
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
    }

    pipeline.runSpec = function(specs) {
        pipeline.head();
        pipeline.clearViews();
        $p.interactions = [];
        response = {};
        $p.pipeline = [];
        $p.crossfilters = [];
        $p.uniform.uFilterFlag.data = 0;
        // $p.uniform.uFilterRanges = $p.fieldDomains.concat($p.deriveDomains);
        specs.forEach(function(spec){
            var opt = Object.keys(spec)[0],
                arg = spec[opt];

            opt = opt.slice(1);
            if(typeof pipeline[opt] == 'function') {
                pipeline[opt](arg);
            }
        })
    }

    pipeline.head = function() {
        pipeline.resume('__init__');
        return pipeline;
    }

    pipeline.run = function(opts) {
        var operations = opts || $p.pipeline;
        operations.forEach(function(p, i){
            var opt = Object.keys(p)[0];
            pipeline[opt](p[opt]);
        })

        return pipeline;
    }

    pipeline.visualize = function(vmap) {
        var optID = addToPipeline('visualize', vmap);
        var viewIndex = 0,
            filters = {};
        if(typeof vmap.id == 'string') {
            viewIndex = $p.views.map(d=>d.id).indexOf(vmap.id);
            if(viewIndex == -1) {
                //find the next available view slot in all views
                for(var vi = 0; vi < $p.views.length; vi++){
                    if(!$p.views[vi].id) {
                        viewIndex = vi;
                        $p.views[viewIndex].id = vmap.id;
                        break;
                    }
                }
            }
        }
        if(vmap.mark == 'bar') vmap.zero = true;
        $p.views[viewIndex].vmap = vmap;
        var encoding = vmap,
            viewTag = $p.views[viewIndex].id;

        if($p._update && response.hasOwnProperty(viewTag)) {
            if(response[viewTag].hasOwnProperty($p._responseType)) {
                encoding = Object.assign({}, vmap, response[viewTag][$p._responseType]);
            }
        }
        if(encoding.opacity != 0){
            operation.visualize({
                vmap: encoding,
                viewIndex: viewIndex
            });
            pipeline.interact();

        }
        return pipeline;
    }

    pipeline.interact = function(spec) {
        if(typeof(spec) != 'undefined') $p.interactions.push(spec);
        $p.interactions.forEach(function(interaction){
            Object(__WEBPACK_IMPORTED_MODULE_5__interact__["a" /* default */])($p, {
                actions: interaction.event,
                view: interaction.from,
                condition: interaction.condition,
                callback: function(selection) {
                    response = interaction.response;
                    if(!$p._update) {
                        $p._update = true;
                        $p.crossfilters = {};
                        if(typeof selection == 'object') {
                            Object.keys(selection).forEach(function(k) {
                                if(selection[k].length < 2) {
                                    if($p.intervals.hasOwnProperty(k)) {
                                        var value = (Array.isArray(selection[k]))
                                            ? selection[k][0]
                                            : selection[k];
                                        selection[k] = [value-$p.intervals[k].interval, value];
                                    } else if(!$p.categoryLookup.hasOwnProperty(k)) {
                                        selection[k] = [selection[k][0] + selection[k][0] + 1];
                                    }
                                }
                                $p.crossfilters[k] = selection[k];
                            });
                        }
                        $p._responseType = 'unselected';
                        $p.uniform.uFilterLevel.data = 0.2;
                        $p.uniform.uVisLevel.data = 0.1;
                        pipeline.head().run();
                        $p._responseType = 'selected';
                        $p.uniform.uVisLevel.data = 0.2;
                        pipeline.head().filter({}).run();
                        $p._responseType = 'unselected';
                        $p._update = false;
                        $p.uniform.uFilterLevel.data = 0.1;
                        $p.uniform.uVisLevel.data = 0.1;
                    }
                }
            })
        })
    }

    pipeline.exportImage = function(beforeExport) {
        var beforeExport = beforeExport || function() { pipeline.head().run() };
        if(typeof operation.visualize.chart.exportImage === 'function') {
            return operation.visualize.chart.exportImage(beforeExport);
        } else {
            return pipeline;
        }
    }

    if(options.hasOwnProperty('data')) {
        pipeline.data(options.data);
    }

    return pipeline;
}


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);

const vecId = ['x', 'y', 'z'];
/* harmony default export */ __webpack_exports__["a"] = (function($p, dataProps) {
    var data = dataProps || [];

    $p.indexes = data.indexes || [];
    $p.categoryIndex = data.CAMs || {};
    $p.categoryLookup = data.TLBs || {};
    $p.dkeys =  data.keys || [];
    $p.dtypes =  data.dtypes || data.types || [];
    $p.intervals =  data.intervals || {};
    $p.cachedResult = [];
    $p.pipeline = [];
    $p.crossfilters = {};
    $p.deriveCount = 0;
    $p.resultDimension = [1, 1];
    $p.dataSize = 0;

    var dkeys = $p.dkeys,
        dtypes = $p.dtypes,
        stats =  data.stats || null;

    if (data.hasOwnProperty("size"))
        $p.dataSize = data.size;
    else if (Array.isArray(data))
        $p.dataSize = Math.max.apply(null, data.map(function(d) {
            return d.length;
        }));

    var rowSize = Math.min($p.dataSize, 8192),
        colSize = Math.ceil($p.dataSize / rowSize);

    $p.dataDimension = [rowSize, colSize];

    $p.fields = $p.indexes.concat(dkeys.filter(function(k) {
        return $p.indexes.indexOf(k) === -1;
    }));
    $p.fieldWidths = new Array($p.fields.length).concat(new Array($p.deriveMax).fill(1));
    $p.fieldCount = $p.fields.length - $p.indexes.length;


    function getDataWidth(fid, range) {
        var range = Math.abs(range[1] - range[0]);
        if (dtypes[fid] == "index" || dtypes[fid] == "int" || dtypes[fid] == "string") {
            return range + 1;
        } else if (dtypes[fid] == "histogram") {
            return range;
        } else if (dtypes[fid] == "time") {
            var interval = stats[$p.fields[fid]].min;
            if (interval === 0) interval = (data[fid][1] - data[fid][0]) || 1;
            $p.intervals[dkeys[fid]] = {};
            $p.intervals[dkeys[fid]].dtype = 'time';
            $p.intervals[dkeys[fid]].interval = interval;
            $p.intervals[dkeys[fid]].min = stats[dkeys[fid]].min;
            $p.intervals[dkeys[fid]].max = stats[dkeys[fid]].max;
            return range / interval + 1;
        } else if (["nominal", "ordinal", "categorical"].indexOf(dtypes[fid]) > -1) {
            return data.TLB.length;
        } else if (dtypes[fid] in ["float", "double", "numeric"]) {
            return 10;
        } else {
            return range+1;
        }
    }
    $p.fields.forEach(function(field) {
        var min = stats[field].min,
            max = stats[field].max,
            fi = dkeys.indexOf(field);
        $p.fieldWidths[fi] = getDataWidth(fi, [min, max]);
    });
    $p.getDataWidth = getDataWidth;
    $p.deriveDomains = new Array($p.deriveMax).fill([0, 1]);
    $p.deriveWidths = new Array($p.deriveMax).fill(1);
    $p.deriveFieldCount = 0;

    if ($p.indexes.length === 0) {
        $p.attribute("aDataIdx", "float", Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataIdy", "float", Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, $p.dataDimension[1] - 1));
        $p.attribute("aDataValx", "float", Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataValy", "float", Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, $p.dataDimension[1] - 1));
    } else {

        $p.indexes.forEach(function(id, i) {
            var indexAttrData = arrays.unique(data[id]).sort(function(a, b) {
                return a - b;
            });
            $p.attribute("aDataVal" + vecId[i], "float", new Float32Array(indexAttrData));
            $p.attribute("aDataId" + vecId[i], "float", Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, indexAttrData.length - 1));
            $p.fieldWidths[i] = indexAttrData.length;
            $p.dataDimension[i] = indexAttrData.length;
        });
    }

    $p.attribute("aDataItemVal0", "float", null);
    $p.attribute("aDataItemVal1", "float", null);
    $p.attribute("aDataItemId", "float", new Float32Array($p.dataSize).map((d,i)=>i));
    $p.attribute("aDataFieldId", "vec2", new Float32Array($p.fields.length * 2).map((d,i)=>i));
    $p.attribute("aVertexId", "float", [0, 1, 2, 3, 4, 5]);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);

    $p.attribute("_square", "vec2", new Float32Array([-1.0, -1.0,
        1.0, -1.0, -1.0, 1.0, -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0
    ]));
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 1);

    //setup all attribute, uniform, texture, varying needed by all the shaders
    $p.uniform("uDataSize",    "float", $p.dataSize);
    $p.uniform("uDataDim",     "vec2",  $p.dataDimension);
    $p.uniform("uResultDim",   "vec2",  $p.dataDimension);
    $p.uniform("uIndexCount",  "int",   $p.indexes.length);
    $p.uniform("uFieldWidths", "float", $p.fieldWidths);
    $p.uniform("uFieldCount",  "int",   $p.fieldCount);
    $p.uniform("uFieldId",     "int",   0);
    $p.uniform("uFilterFlag",  "int",   0);
    $p.uniform("uGroupFields", "int",   [0, -1]);
    $p.uniform("uDataInput",   "sampler2D");
    $p.uniform("uDeriveCount", "int", $p.deriveMax);
    // $p.uniform("uDeriveDomains", "vec2", $p.deriveDomains);
    // $p.uniform("uDeriveWidths", "float", $p.deriveWidths);

    $p.uniform("uFilterLevel", "float", 0.1)
    $p.uniform('uVisLevel',    "float", 0.1)

    $p.varying("vResult", "float");
    $p.varying("vDiscardData", "float");
    $p.texture(
        "tData",
        "float",
        new Float32Array($p.dataDimension[0] * $p.dataDimension[1] * $p.fieldCount), [$p.dataDimension[0], $p.dataDimension[1] * $p.fieldCount],
        "alpha"
    );
    $p.framebuffer("fFilterResults", "unsigned_byte", $p.dataDimension);
    $p.framebuffer("fGroupResults", "float", [1024, 1]);
    $p.framebuffer("fDerivedValues", "float", [$p.dataDimension[0], $p.dataDimension[1] * $p.deriveMax]);

    $p.parameter({
        fieldCount: $p.fields.length - $p.indexes.length,
        indexCount: $p.indexes.length
    });

    $p.fields.slice($p.indexes.length).forEach(function(attr, ai) {
        var buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
        for (var i = 0, l = data[attr].length; i < l; i++) {
            buf[i] = data[attr][i];
        }
        $p.texture.tData.update(
            buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
        );
    });

    //TODO: get data statistics using the GPU
    if(stats !== null) {
        $p.fieldDomains = $p.fields.map(function(k, i) {
            return [stats[k].min, stats[k].max];
        })
        .concat(new Array($p.deriveMax).fill([0, 1]));

        $p.uniform("uFieldDomains", "vec2",  $p.fieldDomains);

    } else {
        $p.uniform("uFieldDomains", "vec2",  $p.fields.map(f => [0, 1]));
    }


    // $p.texture.tData.sampler = $p.uniform.uDataInput;
    $p.uniform.uDataInput = $p.texture.tData;

    function getFieldWidth($int_fid) {
        return this.uFieldWidths[fid];
    }

    function getFieldDomain($int_fid) {
        return this.uFieldDomains[fid];
    }

    function getData($int_fid, $float_r, $float_s) {
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

    function getNonIndexedData($int_fieldId, $float_addrX, $float_addrY) {
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

    $p.subroutine("getFieldWidth", "float", getFieldWidth);
    $p.subroutine("getFieldDomain", "vec2", getFieldDomain);
    $p.subroutine("getData", "float", getData);
    $p.subroutine("getNonIndexedData", "float", getNonIndexedData);

    var gl = $p.ctx;
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

});


/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = output;
function output($p) {
    return function(format) {
        var buf = $p.getResult(),
            res = {},
            offset = 0;

        var rs = 0;

        if ($p.resultDimension[0] > 1) {
            res[$p.fields[rs]] = $p.attribute.aDataValx.data;
            rs++;
        }

        if ($p.resultDimension[1] > 1) {
            var bx = $p.attribute.aDataValx.data;
            var by = $p.attribute.aDataValy.data;
            var ax = new Array($p.resultDimension[0] * $p.resultDimension[1]),
                ay = new Array($p.resultDimension[0] * $p.resultDimension[1]);

            for (var y = 0; y < $p.resultDimension[1]; y++) {
                for (var x = 0; x < $p.resultDimension[0]; x++) {

                    ax[y * $p.resultDimension[0] + x] = bx[x];
                    ay[y * $p.resultDimension[0] + x] = by[y]
                }
            }
            res[$p.fields[0]] = ax;
            res[$p.fields[rs]] = ay;
            rs++;
        }

        var arraySize = $p.resultDimension[0] * $p.resultDimension[1];

        for (var i = rs; i < $p.fields.length; i++) {
            res[$p.fields[i]] = buf.subarray(offset, offset + arraySize);
            offset += arraySize;
        };

        if (format == 'row') {
            var objectArray = new Array(arraySize);

            for (var i = 0; i < arraySize; i++) {
                var obj = {};
                Object.keys(res).forEach(function(f) {
                    var kid = $p.dkeys.indexOf(f),
                        dtype = $p.dtypes[kid];

                    if (dtype == 'string' && $p.categoryLookup.hasOwnProperty(f)) {
                        obj[f] = $p.categoryLookup[f][res[f][i]];
                    } else if ($p.intervals.hasOwnProperty(f) && $p.intervals[f].dtype == 'historgram') {
                        obj[f] = $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
                    } else {
                        obj[f] = res[f][i];
                    }
                });
                objectArray[i] = obj;
            }

            return objectArray;

        } else {
            return res;
        }
    }
}


/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = init;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__flexgl_src_flexgl__ = __webpack_require__(18);


function init(options) {
    var $p = options.context || null,
        container = options.container || document.body,
        viewport = options.viewport || [800, 450],
        padding = {left:0, right: 0,top: 0, bottom: 0};

    var defaultLayout = [
        {
            width: viewport[0],
            height: viewport[1],
            padding: {left: 30, right: 30, top: 30, bottom: 30},
            offset: [0, 0]
        }
    ];
    if ($p === null) {
        $p = new __WEBPACK_IMPORTED_MODULE_0__flexgl_src_flexgl__["a" /* default */]({
            container: container,
            width: viewport[0],
            height: viewport[1],
            padding: padding
        });
        $p.padding = padding;
        $p.viewport = viewport;
    }
    $p.container = container;
    $p.views = options.views || defaultLayout;
    return $p;
}


/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = FlexGL;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__resource__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__program__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shader__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__framebuffer__ = __webpack_require__(24);





function FlexGL(arg) {

    var flexgl = (this instanceof FlexGL) ? this : {},
        options = arg || {},
        container = options.container || null,
        canvas = options.canvas || document.createElement("canvas"),
        width = options.width || null,
        height = options.height || null,
        padding = options.padding || {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        ctx = options.context || options.ctx || null,
        kernels = {},
        program = null,
        sharedFunction = options.sharedFunction || {};


    if (typeof(canvas) == "string") {
        if (canvas[0] == "#") canvas = document.getElementById(cavnas.substring(1));
        else canvas = document.getElementById(cavnas);
    }
    if (container) {
        container = (typeof(container) == "string") ? document.getElementById(container) : container;
        if (width === null) width = container.clientWidth;
        if (height === null) height = container.clientHeight;
    }
    // width -= padding.left + padding.right;
    // height -= padding.top + padding.bottom;
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = "absolute";
    canvas.style.marginLeft = padding.left + "px";
    canvas.style.marginTop = padding.top + "px";

    if (ctx === null)
        ctx = setupWebGL(canvas);
    flexgl.ctx = ctx;
    flexgl.canvas = canvas;

    ctx._dict = options.env || options.dict || options.dictionary || {};


    var resources = new __WEBPACK_IMPORTED_MODULE_0__resource__["a" /* default */](ctx),
        framebuffers = new __WEBPACK_IMPORTED_MODULE_3__framebuffer__["a" /* default */](ctx),
        programManager = new __WEBPACK_IMPORTED_MODULE_1__program__["a" /* default */](ctx, resources),
        shaders = new __WEBPACK_IMPORTED_MODULE_2__shader__["a" /* default */](ctx, resources);

    var blendExt = ctx.getExtension("EXT_blend_minmax");
    if (blendExt) {
        ctx.MAX_EXT = blendExt.MAX_EXT;
        ctx.MIN_EXT = blendExt.MIN_EXT;
    }

    ctx.ext = ctx.getExtension("ANGLE_instanced_arrays");
    enableExtension([
        "OES_texture_float",
        "OES_texture_float_linear",
        // "OES_texture_half_float",
        // "OES_texture_half_float_linear"
    ]);

    if (container)
        container.appendChild(canvas);

    function setupWebGL(canvas) {
        var names = ["webgl", "experimental-webgl"];
        var gl = null;
        for (var i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i]);
            } catch (e) {}
            if (gl) break;
        }
        return gl;
    }

    function enableExtension(extensions) {
        if (!Array.isArray(extensions)) extensions = [extensions];
        extensions.forEach(function(extension) {
            var extProps = ctx.getExtension(extension);
            if (extProps !== null) {
                Object.keys(extProps).forEach(function(ep) {
                    if (!ext.hasOwnProperty(ep)) {
                        ctx.ext[ep] = extProps[ep];
                    }
                })
            }
        });
    };

    flexgl.enableExtension = enableExtension;

    /**
     * Allocate Attributes in vertex buffer array stored in GPU memory
     * @param  {String} name attribute name
     * @param  {String} type attribute type: float, vec2, ...
     * @param  {Array} data data values
     * @return {Object}      FLexGL object
     */
    flexgl.attribute = function(name, type, data) {
        resources.allocate("attribute", name, type, data);
        Object.defineProperty(flexgl.attribute, name, {
            get: function() {
                return resources.attribute[name];
            },
            set: function(data) {
                resources.attribute[name].load(data);
            }
        });
        return flexgl;
    };
    flexgl.buffer = flexgl.attribute; //alias

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type uniform variable type: float, vec2, ...
     * @param  {Array} data data values
     * @return {Object}      FLexGL object
     */
    flexgl.uniform = function(name, type, data) {
        resources.allocate("uniform", name, type, data);
        if (!flexgl.uniform.hasOwnProperty(name)) {
            Object.defineProperty(flexgl.uniform, name, {
                get: function() {
                    return resources.uniform[name];
                },
                set: function(data) {
                    resources.uniform[name].load(data);
                    if (ctx.isProgram(program))
                        resources.uniform[name].link(program);
                }
            });
        }
        return flexgl;
    };

    flexgl.uniform.serialize = function(aoa) {
        var sa = [];
        aoa.forEach(function(a) {
            sa = sa.concat(a);
        })
        return sa;
    }

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type texture type: unsigned_byte or float, ...
     * @param  {Array} data data values
     * @param  {Array} dim [width, height]
     * @param  {String} [channel='alpha'] WebGL formats (rgba, alpha)
     * @param  {Object} [sampler=null] FLexGL Uniform Object
     * @return {Object}      FLexGL object
     */
    flexgl.texture = function(name, type, data, dim, channel, sampler) {
        resources.allocate("texture", name, type, dim, channel, data, sampler);
        Object.defineProperty(flexgl.texture, name, {
            get: function() {
                return resources.texture[name];
            },
            set: function(data) {
                resources.texture[name].load(data);
            }
        });
        return flexgl;
    }

    flexgl.texture.update = function(name, data, offset, dim) {
        resources.texture[name].update(data, offset, dim);
    }

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} [type] Varying variable type: float, vec2, ...
     * @param  {Number} [size=1] data array
     * @return {Object}      FLexGL object
     */
    flexgl.varying = function(name, type, size) {
        resources.allocate("varying", name, type, size);
        return flexgl;
    };

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type attribute type: float, vec2, ...
     * @param  {Array} dim [width, height]
     * @param  {Object} [texture=null] FLexGL Texture Object
     * @return {Object}      FLexGL object
     */
    flexgl.framebuffer = function(name, type, dim, texture) {
        var texture = texture || resources.allocate('texture', name, type, dim, 'rgba', null);

        framebuffers.create(name, type, dim, texture);
        if (!flexgl.framebuffer.hasOwnProperty(name)) {
            Object.defineProperty(flexgl.framebuffer, name, {
                get: function() {
                    return framebuffers[name];
                }
            });
        }
        return flexgl;
    }

    flexgl.framebuffer.enableRead = function(name) {
        framebuffers[name].enableRead(program);
    }

    flexgl.bindFramebuffer = function(fbName) {
        if (fbName === null)
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        else
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffers[fbName].ptr);
    }

    flexgl.subroutine = function(name, type, fn) {
        resources.allocate("subroutine", name, type, fn);
        return flexgl;
    }

    flexgl.parameter = function(keyValuePairs) {
        Object.keys(keyValuePairs).forEach(function(key) {
            ctx._dict[key] = keyValuePairs[key];
            if (Array.isArray(ctx._dict[key])) {
                var i = 0;
                Object.defineProperty(ctx._dict, key, {
                    get: function() {
                        return keyValuePairs[key][i++];
                    },
                    set: function(newArray) {
                        i = 0;
                        ctx._dict[key] = newArray;
                    }
                });
            } else if(typeof(ctx._dict[key]) == 'object') {
                var dictKeys = Object.keys(ctx._dict[key]);
                fxgl.uniform('dict'+key, 'float', dictKeys.map(d=>ctx._dict[key][d]));
            }
        })
        return flexgl;
    }

    flexgl.dictionary = flexgl.parameter;

    flexgl.shader = programManager.shader;

    flexgl.program = function(name, vs, fs) {
        program = programManager.program(name, vs, fs);
        return ctx;
    }

    flexgl.createProgram = function(name, vs, fs) {
        program = programManager.create(name, vs, fs);
        return ctx;
    }

    flexgl.app = function(name, props) {
        var vs = flexgl.shader.vertex(props.vs),
            fs = flexgl.shader.fragment(props.fs),
            fb = props.framebuffer || null;

        flexgl.program(name, vs, fs);

        var draw = props.render || props.draw;

        return function(args) {
            var gl = flexgl.program(name);
            return draw.call(gl, args);
        }
    }

    flexgl.dimension = function() {
        return [canvas.width, canvas.height];
    }

    flexgl.resources = resources;

    return flexgl;
}


/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Resource;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__uniform__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__attribute__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__texture__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__varying__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__subroutine__ = __webpack_require__(22);






function Resource(glContext) {
    var resource = (this instanceof Resource) ? this : {},
        gpuResources = {};

    resource.uniform = new __WEBPACK_IMPORTED_MODULE_0__uniform__["a" /* default */](glContext);
    resource.attribute = new __WEBPACK_IMPORTED_MODULE_1__attribute__["a" /* default */](glContext);
    resource.texture = new __WEBPACK_IMPORTED_MODULE_2__texture__["a" /* default */](glContext);
    resource.varying = new __WEBPACK_IMPORTED_MODULE_3__varying__["a" /* default */](glContext);
    resource.subroutine = new __WEBPACK_IMPORTED_MODULE_4__subroutine__["a" /* default */]();

    var resourceTypes = ['uniform', 'attribute', 'texture', 'varying', 'subroutine'];

    resource.allocate = function(type, props) {
        if (resourceTypes.indexOf(type) === -1) {
            throw Error("Error: Invalid resource type: " + type);
        }
        var res = resource[type].create.apply(null, Array.prototype.slice.call(arguments, 1));
        res.resourceType = type;
        gpuResources[res.name] = res;
        if (!gpuResources.hasOwnProperty(res.name)) {
            Object.defineProperty(gpuResources, res.name, {
                get: function() {
                    return gpuResources[res.name];
                },
                set: function(data) {
                    gpuResources[res.name].load(data);
                }
            });
        }
        return res;
    };

    resource.link = function(program, resources) {
        var requiredResources = (Array.isArray(resources)) ? resources : Object.keys(gpuResources);
        requiredResources.forEach(function(resourceName) {
            if (gpuResources.hasOwnProperty(resourceName))
                gpuResources[resourceName].link(program);
        })
    };

    resource.get = function(name) {
        return gpuResources[name];
    }

    resource.create = resource.allocate;

    return resource;
};


/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Attribute;
function Attribute(glContext) {
    
    var attribute = (this instanceof Attribute) ? this : {},
        ctx = glContext,
        attributeID = 0;

    function setAttribute(name, data) {
        if(Array.isArray(data) || ArrayBuffer.isView(data)){
            if(!ArrayBuffer.isView(data)) data = new Float32Array(data);
            attribute[name].data = data;
            ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].ptr);
            ctx.bufferData(ctx.ARRAY_BUFFER, data, ctx.STATIC_DRAW);
        }
    }
    attribute.create = function(name, type, data) {
        attribute[name] = {
            name: name,
            type: type || 'float',
            data: null,
            location: attributeID++,
            ptr: ctx.createBuffer(),
            size: parseInt(type.slice(3,4)) || 1
        };

        if(data !== null && data.length) setAttribute(name, data);

        attribute[name].link = function(program) {
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.ptr);
            this.location = ctx.getAttribLocation(program, this.name);
            ctx.vertexAttribPointer(this.location, this.size, ctx.FLOAT, false, 0, 0);
            ctx.enableVertexAttribArray(this.location);
            return this;
        }

        attribute[name].load = function(arrayBuffer) {
            setAttribute(this.name, arrayBuffer);
            return this;
        }

        attribute[name].header = function() {
            return 'attribute ' + this.type + ' ' + this.name + ';\n';
        }

        attribute[name].delete = function() {
            ctx.deleteBuffer(this.ptr);
        }

        return attribute[name];
    };

    return attribute;
}


/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Varying;
function Varying(glContext) {

    var varying = (this instanceof Varying) ? this : {},
        ctx = glContext;

    varying.create = function(name, type, size) {
        varying[name] = {
            name: name,
            type: type || 'float',
            size: size || 1,
        };

        varying[name].link = function() {};

        varying[name].header = function() {
            var header = 'varying ' + this.type + ' ' + this.name;
            if(this.size > 1)
                header += '[' + this.size + ']';
            return header + ';\n';
        }

        return varying[name];
    }

    return varying;
}


/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Subroutine;
function Subroutine() {

    var subroutine = (this instanceof Subroutine) ? this : {};

    subroutine.create = function(name, type, fn) {
        subroutine[name] = {
            name: name,
            type: type || 'float',
            fn: fn,
            resourceType: "subroutine"
        };

        subroutine[name].link = function(program) {
            return this;
        }

        subroutine[name].load = function(fn) {
            subroutine[name].fn = fn;
            return this;
        }

        subroutine[name].header = function() {
            return this.fn.toString();
        }

        return subroutine[name];
    };

    return subroutine;
}


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Program;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__shader__ = __webpack_require__(4);


function Program(glContext, resources) {

    var program,
        ctx = glContext,
        pm = {},
        kernels = {},
        shaders = new __WEBPACK_IMPORTED_MODULE_0__shader__["a" /* default */](glContext, resources);

    pm.create = function(name, vs, fs) {
        var name = name || "default",
            vs = vs || "default",
            fs = fs || "default",
            deps = [];

        if (kernels.hasOwnProperty(name)) {
            pm.delete(name);
        }

        kernels[name] = ctx.createProgram();

        kernels[name].vs = (typeof vs == "object") ? vs : shaders.vertex[vs];
        kernels[name].fs = (typeof fs == "object") ? fs : shaders.fragment[fs];

        ctx.attachShader(kernels[name], kernels[name].vs);
        ctx.attachShader(kernels[name], kernels[name].fs);
        ctx.linkProgram(kernels[name]);
        var linked = ctx.getProgramParameter(kernels[name], ctx.LINK_STATUS);
        if (!linked) {
            var lastError = ctx.getProgramInfoLog(kernels[name]);
            throw ("Error in program linking:" + lastError);
            ctx.deleteProgram(kernels[name]);
            return null;
        }

        deps = deps.concat(kernels[name].vs.deps);
        deps = deps.concat(kernels[name].fs.deps);
        kernels[name].deps = deps;

        return kernels[name];
    }

    pm.use = pm.program = function(name, vs, fs) {
        if (kernels.hasOwnProperty(name)) {
            program = kernels[name];
            ctx.useProgram(program);
            resources.link(program, program.deps);
            return program;
        } else {
            return pm.create(name, vs, fs);
        }
    }

    pm.delete = function(name) {
        if (kernels.hasOwnProperty(name)) {
            ctx.detachShader(kernels[name], kernels[name].vs);
            ctx.detachShader(kernels[name], kernels[name].fs);
            ctx.deleteProgram(kernels[name]);
            delete kernels[name];
        }
    }

    pm.shader = function(arg, fn) {
        var options = arg;
        shaders.create(options, fn);
        return pm;
    }

    pm.shader.vertex = function(fn) {
        var options = {
            type: "vertex"
        };
        if (fn.name) options.name = fn.name;
        return shaders.create(options, fn);
    }

    pm.shader.fragment = function(fn) {
        var options = {
            type: "fragment"
        };
        if (fn.name) options.name = fn.name;
        return shaders.create(options, fn);
    }

    return pm;
}


/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = Framebuffer;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__texture__ = __webpack_require__(3);


function Framebuffer(glContext) {

    var framebuffer = (this instanceof Framebuffer) ? this : {},
        ctx = glContext;

    framebuffer.create = function(name, type, dim, texture) {

        framebuffer[name] = {
            ptr: ctx.createFramebuffer(),
            name: name,
            type: type || "float",
            width: dim[0] || 1024,
            height: dim[1] || 1024,
            texture: texture || null,
            renderbuffer: ctx.createRenderbuffer(),
        }

        if (framebuffer[name].texture === null) {
            var buf = (type == 'float') ?
                new Float32Array(dim[0] * dim[1] * 4) :
                new Uint8Array(dim[0] * dim[1] * 4);
            framebuffer[name].texture = Object(__WEBPACK_IMPORTED_MODULE_0__texture__["a" /* default */])(ctx).create(name, type, dim, "rgba", buf);
        }

        var renderbuffer = framebuffer[name].renderbuffer;
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer[name].ptr);
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderbuffer);
        ctx.renderbufferStorage(
            ctx.RENDERBUFFER,
            ctx.DEPTH_COMPONENT16,
            framebuffer[name].width,
            framebuffer[name].height
        );
        ctx.framebufferTexture2D(
            ctx.FRAMEBUFFER,
            ctx.COLOR_ATTACHMENT0,
            ctx.TEXTURE_2D,
            framebuffer[name].texture.ptr,
            0
        );
        ctx.framebufferRenderbuffer(
            ctx.FRAMEBUFFER,
            ctx.DEPTH_ATTACHMENT,
            ctx.RENDERBUFFER,
            renderbuffer
        );
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

        framebuffer[name].enableRead = function(program) {
            ctx.activeTexture(ctx.TEXTURE0 + this.texture.index);
            ctx.bindTexture(ctx.TEXTURE_2D, this.texture.ptr);
            this.texture.location = ctx.getUniformLocation(program, this.texture.name);
            ctx.uniform1i(this.texture.location, this.texture.index);
        };

        framebuffer[name].delete = function() {
            ctx.bindRenderbuffer(gl.RENDERBUFFER, null);
            ctx.bindFramebuffer(gl.FRAMEBUFFER, null);
            ctx.deleteRenderbuffer(this.renderbuffer);
            ctx.deleteTexture(this.texture.ptr)
            ctx.deleteFramebuffer(this.ptr);
        };

        return framebuffer[name];
    }

    return framebuffer;
}


/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = compile;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__derive__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__reveal__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__aggregate__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__cache__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__match__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__extent__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__visualize__ = __webpack_require__(30);








function compile(fxgl, fields, spec) {

    // if(spec.hasOwnProperty('perceptual'))
    //     operations.perceptual = kernels.perceptual(fxgl);
    //
    // if(spec.hasOwnProperty('derive'))
    //     operations.derive = kernels.derive(fxgl, spec.derive);

    return {
        aggregate : Object(__WEBPACK_IMPORTED_MODULE_2__aggregate__["a" /* default */])(fxgl),
        cache     : Object(__WEBPACK_IMPORTED_MODULE_3__cache__["a" /* default */])(fxgl),
        match     : Object(__WEBPACK_IMPORTED_MODULE_4__match__["a" /* default */])(fxgl, fields),
        extent    : Object(__WEBPACK_IMPORTED_MODULE_5__extent__["a" /* default */])(fxgl),
        visualize : Object(__WEBPACK_IMPORTED_MODULE_6__visualize__["a" /* default */])(fxgl)
        // perceive  : kernels.reveal(fxgl)
    }
}


/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = aggregate;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(1);


const vecId = ['x', 'y', 'z'];
const aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];

function aggregate($p) {
    var aggregate = {};

    $p.uniform('uGroupGetStat', 'float', 0.0)
        .uniform('uAggrOpt', 'int', 2);

    function vertexShader() {
        gl_PointSize = 1.0;

        var i, j, k;
        var x, groupKeyValue;

        i = (this.aDataIdx + 0.5) / this.uDataDim.x;
        j = (this.aDataIdy + 0.5) / this.uDataDim.y;
        this.vResult = this.getData(this.uFieldId, i, j);

        if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
            this.vResult = 0.0;
        }

        if (this.uFilterFlag == 1) {
            if (texture2D(this.fFilterResults, vec2(i, j)).a < this.uVisLevel - 0.01)
                this.vResult = 0.0;
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
                    d = this.getFieldDomain(gid);
                    groupKeyValue = (this.getData(gid, i, j) - d.x) / (d.y - d.x) * (this.getFieldWidth(gid)) / (this.getFieldWidth(gid) + 1.);
                    groupKeyValue += 0.5 / this.getFieldWidth(gid);
                }
                pos[ii] = groupKeyValue * 2.0 - 1.0;
            } else {
                pos[ii] = 0.5;
            }
        }

        gl_Position = vec4(pos, 0.0, 1.0);
    }

    function fragmentShader() {
        if (this.vResult == 0.0) discard;

        if (this.uAggrOpt == 2)
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        else
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
    }

    var vs = $p.shader.vertex(vertexShader),
        fs = $p.shader.fragment(fragmentShader);

    $p.program("group", vs, fs);

    var vs2 = $p.shader.vertex(function main() {
        gl_Position = vec4(this._square, 0, 1);
    });

    var fs2 = $p.shader.fragment(function() {
        var x, y, res;
        $vec4(value);
        x = (gl_FragCoord.x) / this.uResultDim.x;
        y = (gl_FragCoord.y) / this.uResultDim.y;
        y = (float(this.uFieldId - this.uIndexCount) + y) / float(this.uFieldCount);
        value = texture2D(this.uDataInput, vec2(x, y));
        if (this.uAggrOpt > 3)
            res = value.a / value.b;
        else
            res = value.a;
        gl_FragColor = vec4(0.0, 0.0, 0.0, res);
    });

    $p.program("group2", vs2, fs2);

    var resultFieldCount,
        getAvgValues = false,
        getVarStd = false,
        resultDomains;

    function _execute(opts, groupFieldIds, resultFieldIds) {
        resultFieldCount = resultFieldIds.length;
        var gl = $p.program("group");
        $p.bindFramebuffer("fGroupResults");
        $p.framebuffer.enableRead("fDerivedValues");
        $p.framebuffer.enableRead("fFilterResults");

        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

        $p.uniform.uGroupFields = groupFieldIds;
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        $p.uniform.uGroupGetStat = 0.0;
        var resultDomains = new Array(resultFieldIds.length);
        $p.uniform.uResultDim = $p.resultDimension;

        getAvgValues = false;
        getVarStd = false;
        resultFieldIds.forEach(function(f, i) {
            var opt = aggrOpts.indexOf(opts[i]);
            if (opt == -1) throw Error("unknow operator for aggreation: " + opts[i]);
            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            if (opt == 0) gl.blendEquation(gl.MIN_EXT);
            else if (opt == 1) gl.blendEquation(gl.MAX_EXT);
            else gl.blendEquation(gl.FUNC_ADD);
            $p.uniform.uFieldId = f;
            $p.uniform.uAggrOpt = opt;
            gl.ext.drawArraysInstancedANGLE(
                gl.POINTS, 0,
                $p.dataDimension[0],
                $p.dataDimension[1]
            );
            if (opt > 3) {
                getAvgValues = true;
                if (opt > 4) getVarStd = true;
            }
        });

        if (getAvgValues) {
            // console.log('*** Second Pass for Aggregation');
            var fieldCount = $p.uniform.uFieldCount.data,
                preAggrData = $p.uniform.uDataInput.data;

            $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;
            $p.uniform.uFieldCount.data = resultFieldIds.length;


                $p.framebuffer(
                    "fAggrStats",
                    "float", [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
                );
                $p.bindFramebuffer("fAggrStats");



            gl = $p.program("group2");
            $p.framebuffer.enableRead("fGroupResults");
            gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);

            gl.disable(gl.BLEND);
            resultFieldIds.forEach(function(f, i) {
                var opt = aggrOpts.indexOf(opts[i]);
                $p.uniform.uAggrOpt = opt;
                $p.uniform.uFieldId = i;
                gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            })
            $p.uniform.uDataInput.data = $p.framebuffer.fAggrStats.texture;

        } else {
            $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;

        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    aggregate.execute = function(spec) {
        var groupFields = spec.$by || spec.$group,
            groupFieldIds = [-1, -1].
        resultDim = [1, 1];

        if (!Array.isArray(groupFields)) groupFields = [groupFields];
        if (groupFields.length == 2) {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            groupFieldIds[1] = $p.fields.indexOf(groupFields[1]);
            $p.resultDimension = [
                $p.fieldWidths[groupFieldIds[0]],
                $p.fieldWidths[groupFieldIds[1]]
            ];
        } else {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            $p.resultDimension = [$p.fieldWidths[groupFieldIds[0]], 1];
        }


        // console.log( groupFieldIds, $p.resultDimension, $p.fieldWidths, $p.fieldDomains);
        // var resultFields = Object.keys(spec).filter(function(d){return d!='$by' && d!='$group';}),
        //     resultFieldIds = resultFields.map(function(f) { return fields.indexOf(f); }),
        //     operators = resultFields.map(function(r){return spec[r]; });


        var newFieldSpec = spec.$calculate || spec.$reduce || spec.$out || null;

        if (newFieldSpec === null) {
            newFieldSpec = {};
            Object.keys(spec).filter(function(d) {
                return d != '$by' && d != '$group';
            }).forEach(function(d) {
                newFieldSpec[d] = spec[d];
            });
        }

        var newFieldNames = Object.keys(newFieldSpec),
            resultFields = newFieldNames.map(function(f) {
                return newFieldSpec[f][Object.keys(newFieldSpec[f])[0]];
            }),
            resultFieldIds = resultFields.map(function(f) {
                return $p.fields.indexOf(f);
            }),
            operators = resultFields.map(function(f, i) {
                return Object.keys(newFieldSpec[newFieldNames[i]])[0];
            });

        if (!$p._update) {
            $p.framebuffer(
                "fGroupResults",
                "float", [$p.resultDimension[0], $p.resultDimension[1] * resultFields.length]
            );
        }
        _execute(operators, groupFieldIds, resultFieldIds);

        $p.getResult = aggregate.result;
        $p.indexes = groupFields;
        $p.dataDimension = $p.resultDimension;

        var newFieldIds = groupFieldIds.filter(function(f) {
            return f !== -1
        }).concat(resultFieldIds);

        $p.fields = groupFields
            .map(function(gf) {
                return (gf.substring(0, 4) == 'bin@') ? gf.slice(4) : gf;
            })
            .concat(newFieldNames);

        $p.uniform.uDataDim.data = $p.resultDimension;
        $p.uniform.uIndexCount.data = $p.indexes.length;
        $p.uniform.uFieldCount.data = $p.fields.length - $p.indexes.length;

        // $p.fieldWidths = $p.fieldWidths.concat($p.deriveWidths);
        // $p.fieldDomains = $p.fieldDomains.concat($p.deriveDomains);

        $p.fieldDomains = newFieldIds.map(function(f) {
            return $p.fieldDomains[f];
        });
        $p.fieldWidths = newFieldIds.map(function(f) {
            return $p.fieldWidths[f];
        });

        // $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;

        $p.attribute.aDataItemId = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(0, $p.resultDimension[0] * $p.resultDimension[1] - 1);
        $p.dataSize = $p.resultDimension[0] * $p.resultDimension[1];
        $p.uniform.uDataSize.data = $p.dataSize;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            $p.attribute['aDataId' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.attribute['aDataVal' + vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + vecId[i]].location, i);
        });

        if ($p.indexes.length == 1) {
            $p.attribute.aDataIdy = new Float32Array(1);
            $p.attribute.aDataValy = new Float32Array(1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        }
        if (!$p._update) {
            resultDomains = $p.opt.extent(resultFieldIds, $p.dataDimension);
        }
        for (var ii = $p.indexes.length; ii < $p.indexes.length + resultFieldIds.length; ii++) {
            $p.fieldDomains[ii] = resultDomains[ii - $p.indexes.length];
            $p.fieldWidths[ii] = resultDomains[ii - $p.indexes.length][1] - resultDomains[ii - $p.indexes.length][0];
        }

        $p.uniform.uFieldDomains.data = $p.fieldDomains;
        $p.uniform.uFieldWidths.data = $p.fieldWidths;
        $p.uniform.uFilterFlag.data = 0;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            var interval = 1;

            if ($p.intervals.hasOwnProperty(d))
                interval = $p.intervals[d].interval;

            $p.attribute['aDataVal' + vecId[i]] = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* seqFloat */])(
                $p.fieldDomains[i][0],
                $p.fieldDomains[i][1],
                interval
            );
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + vecId[i]].location, i);
        });
    }

    aggregate.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.resultDimension[0] * $p.resultDimension[1],
            rowTotal = Math.min(resultSize, $p.resultDimension[0]),
            colTotal = Math.ceil(resultSize / $p.resultDimension[0]);

        $p.bindFramebuffer("fGroupResults");
        var gl = $p.program("group"),
            result = new Float32Array(rowTotal * colTotal * 4 * resultFieldCount);

        gl.readPixels(offset[0], offset[1], rowTotal, colTotal * resultFieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return result.filter(function(d, i) {
            return i % 4 === 3;
        });
    }

    return aggregate;
}


/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = cache;
function cache(fxgl) {
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


/***/ }),
/* 28 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = match;
function vertexShaderFilter(){
    var i, j, k, value;
    var filter = new Int(0);
    var sel = new Int(0);
    var visSelect = new Bool(false);
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
        if(this.uFilterControls[f] == 1 || this.uVisControls[f] == 1) {
            value = this.getData(f, i, j);

            if(this.uFilterControls[f] == 1) {
                if(value < this.uFilterRanges[f].x || value >= this.uFilterRanges[f].y) {
                    filter -= 1;
                }
            }
            if(this.uVisControls[f] == 1) {
                if(value < this.uVisRanges[f].x || value >= this.uVisRanges[f].y) {
                    sel -= 1;
                }
                visSelect = true;
            }

        }
    }
    this.vResult = 0.1;
    if(filter < 0) {
        this.vResult = 0.0;
    } else {
        if(visSelect)
            this.vResult = (sel < 0) ? 0.1 : 0.2;
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function vertexShaderSelect(){
    var i, j, k, value;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    this.vResult = this.uFilterLevel - 0.1;
    value = this.getData(this.uFieldId, i, j);
    for(var l = 0; l < 100; l++){
        if(l < this.uSelectCount) {
            if(value == this.uInSelections[l]) {
                this.vResult = this.uFilterLevel;
            }
        }
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
}

function match($p) {
    const SELECT_MAX = 100;
    var match = {},
        dataDimension = $p.uniform.uDataDim.data,
        fieldCount = $p.fields.length,
        filterControls = new Array(fieldCount).fill(0),
        filterRanges = $p.fieldDomains,
        visControls = new Array(fieldCount).fill(0),
        visRanges = $p.fieldDomains,
        inSelections = new Array(SELECT_MAX);

    $p.uniform("uFilterControls","int", filterControls)
        .uniform("uVisControls","int", filterControls)
        .uniform("uFilterRanges","vec2", filterRanges)
        .uniform("uVisRanges","vec2", filterRanges)
        .uniform("uInSelections", "float", Float32Array.from(inSelections))
        .uniform("uSelectMax", "int", SELECT_MAX)
        .uniform("uSelectCount", "int", 0);

    var filter = {
        vs: $p.shader.vertex(vertexShaderFilter),
        fs: $p.shader.fragment(fragmentShader)
    };

    var sel = {
        vs: $p.shader.vertex(vertexShaderSelect),
        fs: $p.shader.fragment(fragmentShader)
    };

    $p.program("filter", filter.vs, filter.fs);
    $p.program("match", sel.vs, sel.fs);

    match.control = function(ctrl) {
        // filterControls = ctrl;
    }

    function _execute(spec){
        var fields = $p.fields
        var gl;
        var matchFields = Object.keys(spec).filter(function(s){
            return spec[s].hasOwnProperty('$in');
        })
        .concat(Object.keys($p.crossfilters).filter(function(s){
            return $p.crossfilters[s].hasOwnProperty('$in');
        }))


        $p.bindFramebuffer("fFilterResults");
        $p.framebuffer.enableRead("fDerivedValues");
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        if(matchFields.length) {
            gl = $p.program("match");
            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MIN_EXT);

            matchFields.forEach(function(k){
                var fieldId = fields.indexOf(k);
                var inSelections = (spec.hasOwnProperty(k)) ? spec[k].$in :  $p.crossfilters[k].$in;
                if($p.categoryIndex.hasOwnProperty(k)) {
                    inSelections = inSelections
                        .slice(0, SELECT_MAX)
                        .map(function(v) { return $p.categoryIndex[k][v]; });
                } else {
                    inSelections = inSelections.slice(0, SELECT_MAX);
                }
                $p.uniform.uSelectCount = inSelections.length;
                $p.uniform.uInSelections = Float32Array.from(inSelections);
                $p.uniform.uFieldId = fieldId;

                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
                // filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                // filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
                filterRanges[fieldId] = [Math.min.apply(null, inSelections), Math.max.apply(null, inSelections)];
            })
        }
        // console.log($p._responseType, spec);
        var filterSelections = Object.keys(spec).filter(function(s){
            return !spec[s].hasOwnProperty('$in');
        });

        var viewSelections = Object.keys($p.crossfilters).filter(function(s){
            return !$p.crossfilters[s].hasOwnProperty('$in');
        });;

        if(filterSelections.length || viewSelections.length){
            filterControls = new Array(fieldCount).fill(0);

            filterSelections.forEach(function(k){
                var fieldId = fields.indexOf(k);

                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if(spec[k].length < 2) spec[k][1] = spec[k][0];
                filterControls[fieldId] = 1;
                filterRanges[fieldId] = spec[k];
                // filterRanges[fieldId*2] = spec[k][0];
                // filterRanges[fieldId*2+1] = spec[k][1];
            });

            viewSelections.forEach(function(k){
                var fieldId = fields.indexOf(k);
                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if($p.crossfilters[k].length < 2) $p.crossfilters[k][1] = $p.crossfilters[k][0];
                visControls[fieldId] = 1;
                visRanges[fieldId] = $p.crossfilters[k];
            });

            $p.uniform.uFilterControls.data = filterControls;
            $p.uniform.uFilterRanges.data = filterRanges;
            $p.uniform.uVisControls.data = visControls;
            $p.uniform.uVisRanges.data = visRanges;

            gl = $p.program("filter");
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.disable(gl.BLEND);
            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
        }
        $p.ctx.bindFramebuffer($p.ctx.FRAMEBUFFER, null);
        return filterRanges;
    }

    match.execute = function(spec) {
        filterControls = new Array(fieldCount).fill(0);
        visControls = new Array(fieldCount).fill(0);
        var filterSpec = spec;


        Object.keys($p.crossfilters).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !$p.crossfilters[k].$in) {
                $p.crossfilters[k] = {$in: $p.crossfilters[k]};
            }
        });


        Object.keys(filterSpec).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !spec[k].$in) {
                spec[k] = {$in: spec[k]};
            }
        });

        $p.uniform.uFilterFlag = 1;
        if(!$p._update) {
            filterRanges = $p.fieldDomains.slice();
            visRanges = $p.fieldDomains.slice();
        }
        var newDomains = _execute(spec);

        if(!$p._update){
            // console.log('checking filter domains', newDomains);
            newDomains.forEach(function(domain, fid) {
                var d = domain;
                if($p.dtypes[fid] == 'int') d[1] -= 1;
                $p.fieldDomains[fid] = d;
                $p.fieldWidths[fid] = $p.getDataWidth(fid, d);
            });

            $p.uniform.uFieldDomains.data = $p.fieldDomains;
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
    }

    match.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        $p.bindFramebuffer("fFilterResults");

        var gl = $p.ctx;
        var bitmap = new Uint8Array(rowSize*colSize*4);
        gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        // console.log(result.filter(function(d, i){ return i%4===0;} ));
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // var result = [];
        // bitmap.forEach(function(d, i){ if(i%3===0 && d!==0) result.push(d);});
        // console.log(result);
        // return result;
        return  bitmap;
    }

    return match;
}


/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = extent;

const smallest = -Math.pow(2, 128);
function extent(fxgl) {

    var fieldCount = fxgl.uniform.uFieldCount.data;
    fxgl.framebuffer("fStats", "float", [2, fieldCount]);

    var vs = fxgl.shader.vertex(function() {
        gl_PointSize = 1.0;
        var i, j;
        if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
            this.vDiscardData = 1.0;
        } else {
            this.vDiscardData = 0.0;
            i = (this.aDataIdx + 0.5) / this.uDataDim.x;
            j = (this.aDataIdy + 0.5) / this.uDataDim.y;
            this.vResult = this.getData(this.uFieldId, i, j);
        }
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    });

    var fs = fxgl.shader.fragment(function() {
        if (this.vDiscardData == 1.0) discard;
        if (this.vResult >= 0.0) {
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        } else {
            gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
        }
    });

    var gl = fxgl.program("stats", vs, fs);

    return function(fieldIds, dataDimension) {
        if (!fxgl._update) {
            fxgl.framebuffer("fStats", "float", [2, fieldIds.length]);
        }
        var gl = fxgl.program("stats");
        fxgl.framebuffer.enableRead("fGroupResults");

        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE(fxgl.attribute.aDataValy.location, 1);

        fxgl.bindFramebuffer("fStats");
        gl.clearColor(smallest, smallest, smallest, smallest);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        // gl.finish();
        // fxgl.uniform.uDeriveCount = deriveFieldCount;
        var extents = new Array(fieldIds.length);
        var start = new Date();
        var idCount = fxgl.uniform.uIndexCount.data;
        fieldIds.forEach(function(d, i) {
            fxgl.uniform.uFieldId = i + idCount;
            gl.viewport(0, i, 1, 1);
            gl.blendEquation(gl.MAX_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

            gl.viewport(1, i, 1, 1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            gl.blendEquation(gl.MIN_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            // var extent = new Float32Array(8);
            // gl.readPixels(0, i, 2, 1, gl.RGBA, gl.FLOAT, extent);
            // console.log(extent);
            // var ext = extent;
            // var minValue = (ext[0] > 0) ? ext[1] : ext[7],
            //     maxValue = (ext[2] > 0) ? ext[3] : ext[5];
            //  extents[i] = [minValue, maxValue];
        });
        var extent = new Float32Array(8 * fieldIds.length);
        gl.readPixels(0, 0, 2, fieldIds.length, gl.RGBA, gl.FLOAT, extent);
        fieldIds.forEach(function(d, i) {
            var ext = extent.slice(i * 8, i * 8 + 8);
            var minValue = (ext[4] < 0) ? ext[5] : ext[7],
                maxValue = (ext[2] > 0) ? ext[3] : ext[1];
            extents[i] = [minValue, maxValue];
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return extents;
    }
}


/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = visualize;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__color__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ctypes__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__render__ = __webpack_require__(34);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__reveal__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__encode__ = __webpack_require__(35);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__interact__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__metavis_layout__ = __webpack_require__(37);









const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];
const userActions = ['click', 'hover', 'brush', 'zoom', 'pan'];

function visualize($p) {

    var colorManager = Object(__WEBPACK_IMPORTED_MODULE_0__color__["a" /* default */])($p),
        chartPadding = $p.padding || {left: 0, right: 0, top: 0, bottom: 0},
        viewport = [
            $p.viewport[0],
            $p.viewport[1],
        ];

    var vis = new __WEBPACK_IMPORTED_MODULE_6__metavis_layout__["a" /* default */]({
        container: $p.container,
        width: viewport[0] + chartPadding.left + chartPadding.right,
        height: viewport[1] + chartPadding.top + chartPadding.bottom,
        canvas: $p.canvas,
        padding: chartPadding
    });

    $p.uniform('uVisualEncodings',  'int',   new Array(visualEncodings.length).fill(-1))
        .uniform('uViewDim',        'vec2',  $p.viewport)
        .uniform('uVisShape',       'int',   1)
        .uniform('uInterleaveX',    'int',   0)
        .uniform('uVisDomains',     'vec2',  $p.fieldDomains.map(d=>d.slice()))
        .uniform('uVisScale',       'vec2', [1.0, 1.0])
        .uniform('uPosOffset',      'vec2', [0.0, 0.0])
        .uniform('uFeatureCount',   'int',   0)
        .uniform('uMarkSize',       'float', 10.0)
        .uniform('uMarkSpace',      'vec2',  [0.02, 0.02])
        .uniform('uDefaultAlpha',   'float', 1.0)
        .uniform('uDefaultWidth',   'float', 1.0 / $p.viewport[0])
        .uniform('uDefaultHeight',  'float', 1.0 / $p.viewport[1])
        .uniform('uMaxRGBA',        'vec4',  [0, 0, 0, 0])
        .uniform('uDefaultColor',   'vec3',  [0.8, 0, 0])
        .uniform('uColorMode',      'int',   1)
        .varying('vColorRGBA',      'vec4'   );

    var enhance = Object(__WEBPACK_IMPORTED_MODULE_3__reveal__["a" /* default */])($p);

    $p.framebuffer('offScreenFBO', 'float', $p.viewport);
    $p.framebuffer('visStats', 'float', [1, 1]);

    // $p.framebuffer.enableRead('offScreenFBO');
    $p.renderMode = 'instancedXY';

    var renderer = Object(__WEBPACK_IMPORTED_MODULE_2__render__["a" /* default */])($p);

    function updateInstancedAttribute(vm) {
        if(Array.isArray(vm)){
            $p.uniform.uFeatureCount = vm.length;
            var fv = new Float32Array(vm.length*2);
            vm.forEach(function(f, i) {
                fv[i*2] = $p.fields.indexOf(f);
                fv[i*2+1] = i;
            });
            $p.attribute.aDataFieldId = fv;
        }
    }

    var viz = function(options) {
        $p.renderMode = 'instancedXY';
        $p.revealDensity = false;
        var vmap = options.vmap || {},
            mark = options.mark || vmap.mark || 'line',
            data = options.data || null,
            interaction = options.interaction,
            viewIndex = options.viewIndex,
            viewTag = $p.views[viewIndex].id;

        var visDomain = {},
            visDimension = vmap.viewport || [$p.views[viewIndex].width, $p.views[viewIndex].height] || viewport;

        var width = visDimension[0],
            height =  visDimension[1],
            padding = $p.views[viewIndex].padding || chartPadding,
            offset = $p.views[viewIndex].offset || [0, 0];


        var dimSetting = Object(__WEBPACK_IMPORTED_MODULE_4__encode__["a" /* default */])($p, vmap, colorManager);

        if(!$p._update){
            $p.fields.forEach(function(f, i){
                visDomain[f] = $p.fieldDomains[i].slice();
                if(vmap.zero && (f == vmap.height || f == vmap.width ) && visDomain[f][0]>0) visDomain[f][0] = 0;
            });
        }

        var gl = $p.program($p.renderMode);
        $p.framebuffer.enableRead('fFilterResults');
        $p.framebuffer.enableRead('fDerivedValues');
        $p.framebuffer.enableRead('fGroupResults');

        if($p.renderMode == 'instancedXY') {
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        } else if($p.renderMode == 'interleave') {
            updateInstancedAttribute(vmap.x);
            updateInstancedAttribute(vmap.y);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
        } else {
            var val0 = new Float32Array($p.dataSize),
                val1 = new Float32Array($p.dataSize);
            for(var y = 0; y < $p.dataDimension[1]; y++) {
                for(var x = 0; x < $p.dataDimension[0]; x++) {
                    val0[y*$p.dataDimension[0] + x] = $p.attribute.aDataValx.data[x];
                    val1[y*$p.dataDimension[0] + x] = $p.attribute.aDataValy.data[y];
                }
            }
            $p.attribute.aDataItemVal0 = val0;
            $p.attribute.aDataItemVal1 = val1;
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal0.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal1.location, 1);
        }

        // if(typeof data == 'string')
        //     $p.uniform.uDataInput = $p.framebuffer[data].texture;
        var viewSetting = {
            domain: visDomain,
            width: width,
            height: height,
            fields: $p.fields,
            vmap: vmap,
            onclick: interaction,
            categories: $p.categoryLookup,
            padding: padding,
            left: offset[0],
            top: viewport[1] - height - offset[1],
            colors: colorManager.getColors(),
            showLegend: $p.views[viewIndex].legend
        };

        viewSetting = Object.assign(viewSetting, dimSetting);

        if($p.revealDensity) {
            $p.bindFramebuffer('offScreenFBO');
            gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.blendFunc(gl.ONE, gl.ONE );
        } else {
            $p.bindFramebuffer(null);
            // gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
            gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
            // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
        }

        gl.viewport(
            offset[0] + padding.left,
            offset[1] + padding.bottom,
            width-padding.left-padding.right,
            height-padding.top-padding.bottom
        );
        gl.lineWidth(1.0);

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable( gl.BLEND );
        gl.blendEquation(gl.FUNC_ADD);

        if(mark == 'stack') {
            var result = $p.readResult('row');
            viewSetting.data = result.filter(d=>d[vmap.y]>0);
            viewSetting.fields = $p.fields;
            if($p.intervals.hasOwnProperty(vmap.x))
                viewSetting.isHistogram = true;
        }

        //TODO: Maybe just save the needed data domains instead of copying all
        if(!$p._update) {
            var pv = $p.views[viewIndex];
            pv.domains = Object.keys(visDomain).map(f=>visDomain[f]);
            $p.uniform.uVisDomains = pv.domains;
            if(pv.hasOwnProperty('chart') && typeof pv.chart.svg.remove == 'function') {
                pv.chart.svg.remove();
            }
            pv.chart = vis.addChart(viewSetting);
        } else {
            $p.uniform.uVisDomains = $p.views[viewIndex].domains;
            if(mark == 'stack'){
                var result = $p.readResult('row');
                $p.views[viewIndex].chart.update({
                    data: result
                })
            }
        }
        var primitive = gl.POINTS;
        if(['rect', 'bar'].indexOf(mark) !== -1) primitive = gl.TRIANGLES;
        else if(mark == 'line') primitive = gl.LINE_STRIP;

        function draw() {
            if($p.renderMode == 'interleave') {
                var count = $p.attribute.aDataFieldId.data.length / $p.attribute.aDataFieldId.size;
                gl.ext.drawArraysInstancedANGLE(primitive, 0, count, $p.dataSize);
            } else if($p.renderMode == 'polygon'){
                gl.ext.drawArraysInstancedANGLE(primitive, 0, 6, $p.dataSize);
            } else {
                if(primitive == gl.LINE_STRIP) {
                    console.log($p.dataDimension);
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);
                } else {
                    gl.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);
                }
            }
        }

        if(mark!='stack') draw();
        if($p.revealDensity) enhance({
            viewIndex: viewIndex,
            dim: [width, height],
            offset: offset,
            padding: padding
        });
        $p.bindFramebuffer(null);

        if(!$p._update) {
            var actions = Object.keys(vmap)
                .filter(function(act){ return userActions.indexOf(act) !== -1});

            actions.forEach(function(action) {
                var viewId = vmap.id || $p.views[viewIndex].id,
                    response = {};
                response[viewId] = vmap[action];
                $p.interactions.push({
                    event: action,
                    condition: vmap[action].condition,
                    from: viewId,
                    response: response
                })
            })
        }
    }
    viz.chart = vis;
    return viz;
}


/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = color;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__gradients__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__colorhex__ = __webpack_require__(33);



const colorResolution = 256;
const colorSetMax = 32;
const defaultColorScheme = __WEBPACK_IMPORTED_MODULE_0__gradients__["a" /* gradients */]['viridis'];
const defaultColorSet = [
    [255,187,120], [255,127, 14], [174,199,232], [ 44,160, 44],
    [ 31,119,180], [255,152,150], [214, 39, 40], [197,176,213],
    [152,223,138], [148,103,189], [247,182,210], [227,119,194],
    [196,156,148], [140, 86, 75], [127,127,127], [219,219,141],
    [199,199,199], [188,189, 34], [158,218,229], [ 23,190,207]
];

var gradient = defaultColorScheme,
    colorset = defaultColorSet;

function color($p) {
    var colorManager = {};

    $p.uniform('uColorMode',       'int',   0) // 0=categorical, 1=numeric
        .uniform('uColorCount',    'int',   colorSetMax)
        .uniform('uColorSet',      'vec3',  setColorTable(colorset))
        .texture('tColorGraident', 'float', setColorScheme(gradient),  [colorResolution, 1], 'rgba')
        .subroutine('mapColorRGB', 'vec3',  mapColorRGB);

    colorManager.updateScheme = function(newColors) {
        if(typeof newColors == 'string' && __WEBPACK_IMPORTED_MODULE_0__gradients__["a" /* gradients */].hasOwnProperty(newColors)) {
            gradient = __WEBPACK_IMPORTED_MODULE_0__gradients__["a" /* gradients */][newColors];
        } else if(Array.isArray(newColors)) {
            gradient = newColors;
        }
        $p.texture.tColorGraident = setColorScheme(gradient);
    }

    colorManager.updateTable = function(colors) {
        colorset = colors;
        $p.uniform.uColorSet = setColorTable(colors);
    }

    colorManager.colorTable = defaultColorSet.map(function(t){
        return rgba2hex(t);
    });

    colorManager.getColors = function() {
        if($p.uniform.uColorMode == 0) {
            return colorset;
        } else {
            return gradient;
        }
    }

    colorManager.rgb = rgb;
    colorManager.rgba = rgba;

    return colorManager;
}

function colorStrToHex(colorStr) {
    if (typeof __WEBPACK_IMPORTED_MODULE_1__colorhex__["a" /* colorhex */][colorStr.toLowerCase()] != 'undefined')
        return __WEBPACK_IMPORTED_MODULE_1__colorhex__["a" /* colorhex */][colorStr.toLowerCase()];
    else
        return false;
}

function rgb(hexStr) {
    var hex, r, g, b;

    if(hexStr.slice(0,1) == '#')
        hex = hexStr.slice(1);
    else
        hex = colorStrToHex(hexStr).slice(1);

    r = parseInt(hex.substring(0,2), 16) / 255;
    g = parseInt(hex.substring(2,4), 16) / 255;
    b = parseInt(hex.substring(4,6), 16) / 255;
    return [r, g, b];
}

function rgba(hexStr, alpha) {
    var a = alpha || 1.0,
        c = rgb(hexStr);

    return [c[0], c[1], c[2], a];
}

function rgba2hex(c) {
    var r = c[0],
        g = c[1],
        b = c[2],
        a = 1;
    if (r > 255 || g > 255 || b > 255 || a > 255)
        throw 'Invalid color component';
    return (256 + r).toString(16).substr(1) +((1 << 24) + (g << 16) | (b << 8) | a).toString(16).substr(1);
}

function setColorScheme(colors) {
    var cc = colors.length - 1,
        step = (cc >= 0) ? colorResolution / (cc+1) : 1,
        colorGradient = new Float32Array(colorResolution * 4);

    colors.push(colors[cc]);
    for(var i = 0; i < cc+1; i++) {
        var c0 = rgba(colors[i]),
            c1 = rgba(colors[i+1]),
            offset = Math.floor(i * step)*4;

        for(var x = 0; x < step; x++) {
            var xi = x / (step);
            colorGradient[offset+x*4]   = c0[0] + (c1[0] - c0[0]) * xi;
            colorGradient[offset+x*4+1] = c0[1] + (c1[1] - c0[1]) * xi;
            colorGradient[offset+x*4+2] = c0[2] + (c1[2] - c0[2]) * xi;
            colorGradient[offset+x*4+3] = c0[3] + (c1[3] - c0[3]) * xi;
        }
    }
    colors.pop();
    return colorGradient;
}

function setColorTable(colors) {
    var colorTable = new Float32Array(colorSetMax * 3),
        isRgb = false;

    if(colors[0].length == 3) isRgb = true;
    colors.forEach(function(c, i){
        var colorValue = c;
        if(!isRgb) colorValue = rgb(c) * 255;
        colorTable[i*3] = colorValue[0] / 255;
        colorTable[i*3+1] = colorValue[1] / 255;
        colorTable[i*3+2] = colorValue[2] / 255;
    });

    return colorTable;
}

function mapColorRGB($int_fieldId, $float_value) {
    var d = new Vec2();
    var colorRGB = new Vec3();
    var intValue = new Int();
    if(fieldId == -1) {
        colorRGB = this.uDefaultColor;
    } else {
        if(this.uColorMode == 1) {
            colorRGB = texture2D(this.tColorGraident, vec2(value, 1.0)).rgb;
        } else {
            d = this.uVisDomains[fieldId];
            intValue = int(value * (d.y - d.x) + d.x);
            if(intValue >= this.uColorCount) {
                colorRGB = vec3(0.0, 0.0, 0.0);
            } else {
                colorRGB = this.uColorSet[intValue];
            }
        }
    }
    return colorRGB;
}


/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const gradients = {
    "inferno": ["#000004", "#010005", "#010106", "#010108", "#02010a", "#02020c", "#02020e", "#030210", "#040312", "#040314", "#050417", "#060419", "#07051b", "#08051d", "#09061f", "#0a0722", "#0b0724", "#0c0826", "#0d0829", "#0e092b", "#10092d", "#110a30", "#120a32", "#140b34", "#150b37", "#160b39", "#180c3c", "#190c3e", "#1b0c41", "#1c0c43", "#1e0c45", "#1f0c48", "#210c4a", "#230c4c", "#240c4f", "#260c51", "#280b53", "#290b55", "#2b0b57", "#2d0b59", "#2f0a5b", "#310a5c", "#320a5e", "#340a5f", "#360961", "#380962", "#390963", "#3b0964", "#3d0965", "#3e0966", "#400a67", "#420a68", "#440a68", "#450a69", "#470b6a", "#490b6a", "#4a0c6b", "#4c0c6b", "#4d0d6c", "#4f0d6c", "#510e6c", "#520e6d", "#540f6d", "#550f6d", "#57106e", "#59106e", "#5a116e", "#5c126e", "#5d126e", "#5f136e", "#61136e", "#62146e", "#64156e", "#65156e", "#67166e", "#69166e", "#6a176e", "#6c186e", "#6d186e", "#6f196e", "#71196e", "#721a6e", "#741a6e", "#751b6e", "#771c6d", "#781c6d", "#7a1d6d", "#7c1d6d", "#7d1e6d", "#7f1e6c", "#801f6c", "#82206c", "#84206b", "#85216b", "#87216b", "#88226a", "#8a226a", "#8c2369", "#8d2369", "#8f2469", "#902568", "#922568", "#932667", "#952667", "#972766", "#982766", "#9a2865", "#9b2964", "#9d2964", "#9f2a63", "#a02a63", "#a22b62", "#a32c61", "#a52c60", "#a62d60", "#a82e5f", "#a92e5e", "#ab2f5e", "#ad305d", "#ae305c", "#b0315b", "#b1325a", "#b3325a", "#b43359", "#b63458", "#b73557", "#b93556", "#ba3655", "#bc3754", "#bd3853", "#bf3952", "#c03a51", "#c13a50", "#c33b4f", "#c43c4e", "#c63d4d", "#c73e4c", "#c83f4b", "#ca404a", "#cb4149", "#cc4248", "#ce4347", "#cf4446", "#d04545", "#d24644", "#d34743", "#d44842", "#d54a41", "#d74b3f", "#d84c3e", "#d94d3d", "#da4e3c", "#db503b", "#dd513a", "#de5238", "#df5337", "#e05536", "#e15635", "#e25734", "#e35933", "#e45a31", "#e55c30", "#e65d2f", "#e75e2e", "#e8602d", "#e9612b", "#ea632a", "#eb6429", "#eb6628", "#ec6726", "#ed6925", "#ee6a24", "#ef6c23", "#ef6e21", "#f06f20", "#f1711f", "#f1731d", "#f2741c", "#f3761b", "#f37819", "#f47918", "#f57b17", "#f57d15", "#f67e14", "#f68013", "#f78212", "#f78410", "#f8850f", "#f8870e", "#f8890c", "#f98b0b", "#f98c0a", "#f98e09", "#fa9008", "#fa9207", "#fa9407", "#fb9606", "#fb9706", "#fb9906", "#fb9b06", "#fb9d07", "#fc9f07", "#fca108", "#fca309", "#fca50a", "#fca60c", "#fca80d", "#fcaa0f", "#fcac11", "#fcae12", "#fcb014", "#fcb216", "#fcb418", "#fbb61a", "#fbb81d", "#fbba1f", "#fbbc21", "#fbbe23", "#fac026", "#fac228", "#fac42a", "#fac62d", "#f9c72f", "#f9c932", "#f9cb35", "#f8cd37", "#f8cf3a", "#f7d13d", "#f7d340", "#f6d543", "#f6d746", "#f5d949", "#f5db4c", "#f4dd4f", "#f4df53", "#f4e156", "#f3e35a", "#f3e55d", "#f2e661", "#f2e865", "#f2ea69", "#f1ec6d", "#f1ed71", "#f1ef75", "#f1f179", "#f2f27d", "#f2f482", "#f3f586", "#f3f68a", "#f4f88e", "#f5f992", "#f6fa96", "#f8fb9a", "#f9fc9d", "#fafda1", "#fcffa4"],
    "magma": ["#000004", "#010005", "#010106", "#010108", "#020109", "#02020b", "#02020d", "#03030f", "#030312", "#040414", "#050416", "#060518", "#06051a", "#07061c", "#08071e", "#090720", "#0a0822", "#0b0924", "#0c0926", "#0d0a29", "#0e0b2b", "#100b2d", "#110c2f", "#120d31", "#130d34", "#140e36", "#150e38", "#160f3b", "#180f3d", "#19103f", "#1a1042", "#1c1044", "#1d1147", "#1e1149", "#20114b", "#21114e", "#221150", "#241253", "#251255", "#271258", "#29115a", "#2a115c", "#2c115f", "#2d1161", "#2f1163", "#311165", "#331067", "#341069", "#36106b", "#38106c", "#390f6e", "#3b0f70", "#3d0f71", "#3f0f72", "#400f74", "#420f75", "#440f76", "#451077", "#471078", "#491078", "#4a1079", "#4c117a", "#4e117b", "#4f127b", "#51127c", "#52137c", "#54137d", "#56147d", "#57157e", "#59157e", "#5a167e", "#5c167f", "#5d177f", "#5f187f", "#601880", "#621980", "#641a80", "#651a80", "#671b80", "#681c81", "#6a1c81", "#6b1d81", "#6d1d81", "#6e1e81", "#701f81", "#721f81", "#732081", "#752181", "#762181", "#782281", "#792282", "#7b2382", "#7c2382", "#7e2482", "#802582", "#812581", "#832681", "#842681", "#862781", "#882781", "#892881", "#8b2981", "#8c2981", "#8e2a81", "#902a81", "#912b81", "#932b80", "#942c80", "#962c80", "#982d80", "#992d80", "#9b2e7f", "#9c2e7f", "#9e2f7f", "#a02f7f", "#a1307e", "#a3307e", "#a5317e", "#a6317d", "#a8327d", "#aa337d", "#ab337c", "#ad347c", "#ae347b", "#b0357b", "#b2357b", "#b3367a", "#b5367a", "#b73779", "#b83779", "#ba3878", "#bc3978", "#bd3977", "#bf3a77", "#c03a76", "#c23b75", "#c43c75", "#c53c74", "#c73d73", "#c83e73", "#ca3e72", "#cc3f71", "#cd4071", "#cf4070", "#d0416f", "#d2426f", "#d3436e", "#d5446d", "#d6456c", "#d8456c", "#d9466b", "#db476a", "#dc4869", "#de4968", "#df4a68", "#e04c67", "#e24d66", "#e34e65", "#e44f64", "#e55064", "#e75263", "#e85362", "#e95462", "#ea5661", "#eb5760", "#ec5860", "#ed5a5f", "#ee5b5e", "#ef5d5e", "#f05f5e", "#f1605d", "#f2625d", "#f2645c", "#f3655c", "#f4675c", "#f4695c", "#f56b5c", "#f66c5c", "#f66e5c", "#f7705c", "#f7725c", "#f8745c", "#f8765c", "#f9785d", "#f9795d", "#f97b5d", "#fa7d5e", "#fa7f5e", "#fa815f", "#fb835f", "#fb8560", "#fb8761", "#fc8961", "#fc8a62", "#fc8c63", "#fc8e64", "#fc9065", "#fd9266", "#fd9467", "#fd9668", "#fd9869", "#fd9a6a", "#fd9b6b", "#fe9d6c", "#fe9f6d", "#fea16e", "#fea36f", "#fea571", "#fea772", "#fea973", "#feaa74", "#feac76", "#feae77", "#feb078", "#feb27a", "#feb47b", "#feb67c", "#feb77e", "#feb97f", "#febb81", "#febd82", "#febf84", "#fec185", "#fec287", "#fec488", "#fec68a", "#fec88c", "#feca8d", "#fecc8f", "#fecd90", "#fecf92", "#fed194", "#fed395", "#fed597", "#fed799", "#fed89a", "#fdda9c", "#fddc9e", "#fddea0", "#fde0a1", "#fde2a3", "#fde3a5", "#fde5a7", "#fde7a9", "#fde9aa", "#fdebac", "#fcecae", "#fceeb0", "#fcf0b2", "#fcf2b4", "#fcf4b6", "#fcf6b8", "#fcf7b9", "#fcf9bb", "#fcfbbd", "#fcfdbf"],
    "plasma": ["#0d0887", "#100788", "#130789", "#16078a", "#19068c", "#1b068d", "#1d068e", "#20068f", "#220690", "#240691", "#260591", "#280592", "#2a0593", "#2c0594", "#2e0595", "#2f0596", "#310597", "#330597", "#350498", "#370499", "#38049a", "#3a049a", "#3c049b", "#3e049c", "#3f049c", "#41049d", "#43039e", "#44039e", "#46039f", "#48039f", "#4903a0", "#4b03a1", "#4c02a1", "#4e02a2", "#5002a2", "#5102a3", "#5302a3", "#5502a4", "#5601a4", "#5801a4", "#5901a5", "#5b01a5", "#5c01a6", "#5e01a6", "#6001a6", "#6100a7", "#6300a7", "#6400a7", "#6600a7", "#6700a8", "#6900a8", "#6a00a8", "#6c00a8", "#6e00a8", "#6f00a8", "#7100a8", "#7201a8", "#7401a8", "#7501a8", "#7701a8", "#7801a8", "#7a02a8", "#7b02a8", "#7d03a8", "#7e03a8", "#8004a8", "#8104a7", "#8305a7", "#8405a7", "#8606a6", "#8707a6", "#8808a6", "#8a09a5", "#8b0aa5", "#8d0ba5", "#8e0ca4", "#8f0da4", "#910ea3", "#920fa3", "#9410a2", "#9511a1", "#9613a1", "#9814a0", "#99159f", "#9a169f", "#9c179e", "#9d189d", "#9e199d", "#a01a9c", "#a11b9b", "#a21d9a", "#a31e9a", "#a51f99", "#a62098", "#a72197", "#a82296", "#aa2395", "#ab2494", "#ac2694", "#ad2793", "#ae2892", "#b02991", "#b12a90", "#b22b8f", "#b32c8e", "#b42e8d", "#b52f8c", "#b6308b", "#b7318a", "#b83289", "#ba3388", "#bb3488", "#bc3587", "#bd3786", "#be3885", "#bf3984", "#c03a83", "#c13b82", "#c23c81", "#c33d80", "#c43e7f", "#c5407e", "#c6417d", "#c7427c", "#c8437b", "#c9447a", "#ca457a", "#cb4679", "#cc4778", "#cc4977", "#cd4a76", "#ce4b75", "#cf4c74", "#d04d73", "#d14e72", "#d24f71", "#d35171", "#d45270", "#d5536f", "#d5546e", "#d6556d", "#d7566c", "#d8576b", "#d9586a", "#da5a6a", "#da5b69", "#db5c68", "#dc5d67", "#dd5e66", "#de5f65", "#de6164", "#df6263", "#e06363", "#e16462", "#e26561", "#e26660", "#e3685f", "#e4695e", "#e56a5d", "#e56b5d", "#e66c5c", "#e76e5b", "#e76f5a", "#e87059", "#e97158", "#e97257", "#ea7457", "#eb7556", "#eb7655", "#ec7754", "#ed7953", "#ed7a52", "#ee7b51", "#ef7c51", "#ef7e50", "#f07f4f", "#f0804e", "#f1814d", "#f1834c", "#f2844b", "#f3854b", "#f3874a", "#f48849", "#f48948", "#f58b47", "#f58c46", "#f68d45", "#f68f44", "#f79044", "#f79143", "#f79342", "#f89441", "#f89540", "#f9973f", "#f9983e", "#f99a3e", "#fa9b3d", "#fa9c3c", "#fa9e3b", "#fb9f3a", "#fba139", "#fba238", "#fca338", "#fca537", "#fca636", "#fca835", "#fca934", "#fdab33", "#fdac33", "#fdae32", "#fdaf31", "#fdb130", "#fdb22f", "#fdb42f", "#fdb52e", "#feb72d", "#feb82c", "#feba2c", "#febb2b", "#febd2a", "#febe2a", "#fec029", "#fdc229", "#fdc328", "#fdc527", "#fdc627", "#fdc827", "#fdca26", "#fdcb26", "#fccd25", "#fcce25", "#fcd025", "#fcd225", "#fbd324", "#fbd524", "#fbd724", "#fad824", "#fada24", "#f9dc24", "#f9dd25", "#f8df25", "#f8e125", "#f7e225", "#f7e425", "#f6e626", "#f6e826", "#f5e926", "#f5eb27", "#f4ed27", "#f3ee27", "#f3f027", "#f2f227", "#f1f426", "#f1f525", "#f0f724", "#f0f921"],
    "viridis": ["#440154", "#440256", "#450457", "#450559", "#46075a", "#46085c", "#460a5d", "#460b5e", "#470d60", "#470e61", "#471063", "#471164", "#471365", "#481467", "#481668", "#481769", "#48186a", "#481a6c", "#481b6d", "#481c6e", "#481d6f", "#481f70", "#482071", "#482173", "#482374", "#482475", "#482576", "#482677", "#482878", "#482979", "#472a7a", "#472c7a", "#472d7b", "#472e7c", "#472f7d", "#46307e", "#46327e", "#46337f", "#463480", "#453581", "#453781", "#453882", "#443983", "#443a83", "#443b84", "#433d84", "#433e85", "#423f85", "#424086", "#424186", "#414287", "#414487", "#404588", "#404688", "#3f4788", "#3f4889", "#3e4989", "#3e4a89", "#3e4c8a", "#3d4d8a", "#3d4e8a", "#3c4f8a", "#3c508b", "#3b518b", "#3b528b", "#3a538b", "#3a548c", "#39558c", "#39568c", "#38588c", "#38598c", "#375a8c", "#375b8d", "#365c8d", "#365d8d", "#355e8d", "#355f8d", "#34608d", "#34618d", "#33628d", "#33638d", "#32648e", "#32658e", "#31668e", "#31678e", "#31688e", "#30698e", "#306a8e", "#2f6b8e", "#2f6c8e", "#2e6d8e", "#2e6e8e", "#2e6f8e", "#2d708e", "#2d718e", "#2c718e", "#2c728e", "#2c738e", "#2b748e", "#2b758e", "#2a768e", "#2a778e", "#2a788e", "#29798e", "#297a8e", "#297b8e", "#287c8e", "#287d8e", "#277e8e", "#277f8e", "#27808e", "#26818e", "#26828e", "#26828e", "#25838e", "#25848e", "#25858e", "#24868e", "#24878e", "#23888e", "#23898e", "#238a8d", "#228b8d", "#228c8d", "#228d8d", "#218e8d", "#218f8d", "#21908d", "#21918c", "#20928c", "#20928c", "#20938c", "#1f948c", "#1f958b", "#1f968b", "#1f978b", "#1f988b", "#1f998a", "#1f9a8a", "#1e9b8a", "#1e9c89", "#1e9d89", "#1f9e89", "#1f9f88", "#1fa088", "#1fa188", "#1fa187", "#1fa287", "#20a386", "#20a486", "#21a585", "#21a685", "#22a785", "#22a884", "#23a983", "#24aa83", "#25ab82", "#25ac82", "#26ad81", "#27ad81", "#28ae80", "#29af7f", "#2ab07f", "#2cb17e", "#2db27d", "#2eb37c", "#2fb47c", "#31b57b", "#32b67a", "#34b679", "#35b779", "#37b878", "#38b977", "#3aba76", "#3bbb75", "#3dbc74", "#3fbc73", "#40bd72", "#42be71", "#44bf70", "#46c06f", "#48c16e", "#4ac16d", "#4cc26c", "#4ec36b", "#50c46a", "#52c569", "#54c568", "#56c667", "#58c765", "#5ac864", "#5cc863", "#5ec962", "#60ca60", "#63cb5f", "#65cb5e", "#67cc5c", "#69cd5b", "#6ccd5a", "#6ece58", "#70cf57", "#73d056", "#75d054", "#77d153", "#7ad151", "#7cd250", "#7fd34e", "#81d34d", "#84d44b", "#86d549", "#89d548", "#8bd646", "#8ed645", "#90d743", "#93d741", "#95d840", "#98d83e", "#9bd93c", "#9dd93b", "#a0da39", "#a2da37", "#a5db36", "#a8db34", "#aadc32", "#addc30", "#b0dd2f", "#b2dd2d", "#b5de2b", "#b8de29", "#bade28", "#bddf26", "#c0df25", "#c2df23", "#c5e021", "#c8e020", "#cae11f", "#cde11d", "#d0e11c", "#d2e21b", "#d5e21a", "#d8e219", "#dae319", "#dde318", "#dfe318", "#e2e418", "#e5e419", "#e7e419", "#eae51a", "#ece51b", "#efe51c", "#f1e51d", "#f4e61e", "#f6e620", "#f8e621", "#fbe723", "#fde725"]
};
/* harmony export (immutable) */ __webpack_exports__["a"] = gradients;



/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const colorhex = {
    "aliceblue": "#f0f8ff",
    "antiquewhite": "#faebd7",
    "aqua": "#00ffff",
    "aquamarine": "#7fffd4",
    "azure": "#f0ffff",
    "beige": "#f5f5dc",
    "bisque": "#ffe4c4",
    "black": "#000000",
    "blanchedalmond": "#ffebcd",
    "blue": "#0000ff",
    "blueviolet": "#8a2be2",
    "brown": "#a52a2a",
    "burlywood": "#deb887",
    "cadetblue": "#5f9ea0",
    "chartreuse": "#7fff00",
    "chocolate": "#d2691e",
    "coral": "#ff7f50",
    "cornflowerblue": "#6495ed",
    "cornsilk": "#fff8dc",
    "crimson": "#dc143c",
    "cyan": "#00ffff",
    "darkblue": "#00008b",
    "darkcyan": "#008b8b",
    "darkgoldenrod": "#b8860b",
    "darkgray": "#a9a9a9",
    "darkgreen": "#006400",
    "darkkhaki": "#bdb76b",
    "darkmagenta": "#8b008b",
    "darkolivegreen": "#556b2f",
    "darkorange": "#ff8c00",
    "darkorchid": "#9932cc",
    "darkred": "#8b0000",
    "darksalmon": "#e9967a",
    "darkseagreen": "#8fbc8f",
    "darkslateblue": "#483d8b",
    "darkslategray": "#2f4f4f",
    "darkturquoise": "#00ced1",
    "darkviolet": "#9400d3",
    "deeppink": "#ff1493",
    "deepskyblue": "#00bfff",
    "dimgray": "#696969",
    "dodgerblue": "#1e90ff",
    "firebrick": "#b22222",
    "floralwhite": "#fffaf0",
    "forestgreen": "#228b22",
    "fuchsia": "#ff00ff",
    "gainsboro": "#dcdcdc",
    "ghostwhite": "#f8f8ff",
    "gold": "#ffd700",
    "goldenrod": "#daa520",
    "gray": "#808080",
    "green": "#008000",
    "greenyellow": "#adff2f",
    "honeydew": "#f0fff0",
    "hotpink": "#ff69b4",
    "indianred ": "#cd5c5c",
    "indigo": "#4b0082",
    "ivory": "#fffff0",
    "khaki": "#f0e68c",
    "lavender": "#e6e6fa",
    "lavenderblush": "#fff0f5",
    "lawngreen": "#7cfc00",
    "lemonchiffon": "#fffacd",
    "lightblue": "#add8e6",
    "lightcoral": "#f08080",
    "lightcyan": "#e0ffff",
    "lightgoldenrodyellow": "#fafad2",
    "lightgrey": "#d3d3d3",
    "lightgreen": "#90ee90",
    "lightpink": "#ffb6c1",
    "lightsalmon": "#ffa07a",
    "lightseagreen": "#20b2aa",
    "lightskyblue": "#87cefa",
    "lightslategray": "#778899",
    "lightsteelblue": "#b0c4de",
    "lightyellow": "#ffffe0",
    "lime": "#00ff00",
    "limegreen": "#32cd32",
    "linen": "#faf0e6",
    "magenta": "#ff00ff",
    "maroon": "#800000",
    "mediumaquamarine": "#66cdaa",
    "mediumblue": "#0000cd",
    "mediumorchid": "#ba55d3",
    "mediumpurple": "#9370d8",
    "mediumseagreen": "#3cb371",
    "mediumslateblue": "#7b68ee",
    "mediumspringgreen": "#00fa9a",
    "mediumturquoise": "#48d1cc",
    "mediumvioletred": "#c71585",
    "midnightblue": "#191970",
    "mintcream": "#f5fffa",
    "mistyrose": "#ffe4e1",
    "moccasin": "#ffe4b5",
    "navajowhite": "#ffdead",
    "navy": "#000080",
    "oldlace": "#fdf5e6",
    "olive": "#808000",
    "olivedrab": "#6b8e23",
    "orange": "#ffa500",
    "orangered": "#ff4500",
    "orchid": "#da70d6",
    "palegoldenrod": "#eee8aa",
    "palegreen": "#98fb98",
    "paleturquoise": "#afeeee",
    "palevioletred": "#d87093",
    "papayawhip": "#ffefd5",
    "peachpuff": "#ffdab9",
    "peru": "#cd853f",
    "pink": "#ffc0cb",
    "plum": "#dda0dd",
    "powderblue": "#b0e0e6",
    "purple": "#800080",
    "red": "#ff0000",
    "rosybrown": "#bc8f8f",
    "royalblue": "#4169e1",
    "saddlebrown": "#8b4513",
    "salmon": "#fa8072",
    "sandybrown": "#f4a460",
    "seagreen": "#2e8b57",
    "seashell": "#fff5ee",
    "sienna": "#a0522d",
    "silver": "#c0c0c0",
    "skyblue": "#87ceeb",
    "slateblue": "#6a5acd",
    "slategray": "#708090",
    "snow": "#fffafa",
    "springgreen": "#00ff7f",
    "steelblue": "#4682b4",
    "tan": "#d2b48c",
    "teal": "#008080",
    "thistle": "#d8bfd8",
    "tomato": "#ff6347",
    "turquoise": "#40e0d0",
    "violet": "#ee82ee",
    "wheat": "#f5deb3",
    "white": "#ffffff",
    "whitesmoke": "#f5f5f5",
    "yellow": "#ffff00",
    "yellowgreen": "#9acd32"
};
/* harmony export (immutable) */ __webpack_exports__["a"] = colorhex;



/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = render;
function visMap(
    $int_fieldId,
    $float_addrX,
    $float_addrY,
    $float_indexedValue0,
    $float_indexedValue1,
    $float_defaultValue,
    $float_exp
){
    var value;
    var d = new Vec2();
    if(fieldId > -1) {
        if(fieldId >= this.uIndexCount) {
            value = this.getNonIndexedData(fieldId, addrX, addrY);
        } else if(fieldId < this.uIndexCount) {
            value = (fieldId == 0) ? indexedValue0 : indexedValue1;
        }
        if(exp != 0.0) {
            value = pow(value, exp);
        }
        d = this.uVisDomains[fieldId];
        value = (value - d.x) / (d.y - d.x);
    } else {
        value = defaultValue;
    }
    return value;
};

var instancedXY = {};
instancedXY.vs  = function() {
    var i, j, posX, posY, color, alpha, width, height, size;
    var rgb = new Vec3();

    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    if(this.uFilterFlag == 1) {
        this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
    } else {
        this.vResult = this.uVisLevel;
    }

    posX = this.visMap(this.uVisualEncodings[0], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
    posY = this.visMap(this.uVisualEncodings[1], i, j, this.aDataValx, this.aDataValy, 0.0,  0.0);
    color = this.visMap(this.uVisualEncodings[2], i, j, this.aDataValx, this.aDataValy, -1.0,  0.0);
    alpha = this.visMap(this.uVisualEncodings[3], i, j, this.aDataValx, this.aDataValy, this.uDefaultAlpha, 0.0);
    size = this.visMap(this.uVisualEncodings[6], i, j, this.aDataValx, this.aDataValy, 1.0,  0.0);

    posX = posX * 2.0 - 1.0;
    posY = posY * 2.0 - 1.0;

    rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
    gl_PointSize = size * this.uMarkSize;
    this.vColorRGBA = vec4(rgb, alpha);
    gl_Position = vec4(posX, posY , 0.0, 1.0);
};

instancedXY.fs = function() {
    var valid = new Bool();
    valid = this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01;
    if(this.uVisShape == 1) {
        var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        var delta = 0.15;
        var alpha = this.vColorRGBA.a - smoothstep(0.5-delta, 0.5, dist);
        if( this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01) {
            gl_FragColor = vec4(this.vColorRGBA.rgb*alpha, alpha);
        } else {
            discard;
        }
    } else {
        if( this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01) {
            gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a,  this.vColorRGBA.a);
        } else {
            discard;
        }
    }

}

var interleave = {};
interleave.vs = function(){
    var i, j;
    var rgb = new Vec3();
    var posX, posY, size, color, alpha;
    gl_PointSize = this.uMarkSize;
    i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
    j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

    this.vResult = this.uVisLevel;
    if(this.uFilterFlag == 1) {
        this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
    }
    if(this.uInterleaveX == 1) {
        posX = this.aDataFieldId.y / float(this.uFeatureCount-1);
        posY = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
    } else {
        posY = 1.0 - this.aDataFieldId.y / float(this.uFeatureCount-1);
        posX = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
    }
    color = this.visMap(this.uVisualEncodings[2], i, j, i, j, -1.0,  0.0);
    alpha = this.visMap(this.uVisualEncodings[3], i, j, i, j, this.uDefaultAlpha, 0.0);

    posX = posX * 2.0 - 1.0;
    posY = posY * 2.0 - 1.0;

    rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
    this.vColorRGBA = vec4(rgb*alpha, alpha);

    gl_Position = vec4(posX, posY, 0.0, 1.0);
}

interleave.fs = function() {
    if(this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01)
        gl_FragColor = this.vColorRGBA;
    else
        discard;
}

var polygon = {};
polygon.vs = function(){
    var i, j;
    var rgb = new Vec3();
    var posX, posY, color, alpha, width, height, size;
    i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
    j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

    this.vResult = this.uVisLevel;

    if(this.uFilterFlag == 1) {
        this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
    }
    var val0, val1;
    val0 = this.aDataItemVal0;
    val1 = this.aDataItemVal1;
    posX = this.visMap(this.uVisualEncodings[0], i, j, val0, val1, 0.0, 0.0);
    posY = this.visMap(this.uVisualEncodings[1], i, j, val0, val1, 0.0,  0.0);
    color = this.visMap(this.uVisualEncodings[2], i, j, val0, val1, -1.0,  0.0);
    alpha = this.visMap(this.uVisualEncodings[3], i, j,  val0, val1, this.uDefaultAlpha, 0.0);
    width = this.visMap(this.uVisualEncodings[4], i, j,  val0, val1, this.uDefaultWidth, 0.0);
    height = this.visMap(this.uVisualEncodings[5], i, j,  val0, val1, this.uDefaultHeight, 0.0);
    size = this.visMap(this.uVisualEncodings[6], i, j, val0, val1, this.uMarkSize,  0.0);
    posX = posX * (this.uFieldWidths[this.uVisualEncodings[0]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[0]];
    posY = posY * (this.uFieldWidths[this.uVisualEncodings[1]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[1]];

    width *= 1.0 - this.uMarkSpace.x * 2.0;
    height *= 1.0 - this.uMarkSpace.y * 2.0;
    posX -= this.uMarkSpace.x * width;
    posY += this.uMarkSpace.y * height;

    if(this.aVertexId == 0.0 || this.aVertexId == 3.0) {
        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;
    } else if(this.aVertexId == 1.0) {
        posX = posX * 2.0 - 1.0;
        posY = (posY + height) * 2.0 - 1.0;
    } else if(this.aVertexId == 2.0 || this.aVertexId == 5.0) {
        posX = (posX + width) * 2.0 - 1.0;
        posY = (posY + height) * 2.0 - 1.0;
    } else if(this.aVertexId == 4.0) {
        posX = (posX + width) * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;
    } else {
        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;
    }

    rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
    this.vColorRGBA = vec4(rgb*alpha, alpha);
    gl_Position = vec4(posX, posY, 0.0, 1.0);
}

polygon.fs = function() {
    if(this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01)
        gl_FragColor = this.vColorRGBA;
    else
        discard;
}

function render(fxgl) {
    fxgl.subroutine('visMap', 'float', visMap);
    fxgl.program("instancedXY",
        fxgl.shader.vertex(instancedXY.vs),
        fxgl.shader.fragment(instancedXY.fs)
    );
    fxgl.program(
        "interleave",
        fxgl.shader.vertex(interleave.vs),
        fxgl.shader.fragment(interleave.fs)
    );
    fxgl.program(
        "polygon",
        fxgl.shader.vertex(polygon.vs),
        fxgl.shader.fragment(polygon.fs)
    );
}


/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = encode;
const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];

function encode($p, vmap, colorManager) {
    var opacity = vmap.opacity || vmap.alpha;
    var vmapIndex = new Int32Array(visualEncodings.length);
    visualEncodings.forEach(function(code, codeIndex){
        vmapIndex[codeIndex] = $p.fields.indexOf(vmap[code]);
    })
    $p.uniform.uVisualEncodings.data = vmapIndex;
    $p.uniform.uDefaultAlpha.data = 1.0;
    if(vmapIndex[2] === -1) {
        if (typeof(vmap.color) === 'string'){
            if(vmap.color === 'auto') {
                $p.revealDensity = true;
                $p.uniform.uRevealMode.data = 1;
            } else {
                $p.uniform.uDefaultColor.data = colorManager.rgb(vmap.color);
            }
        } else {
            if(typeof(vmap.size) == 'number') {
                $p.uniform.uMarkSize = vmap.size;
            }
        }
    } else {
        if($p.categoryLookup.hasOwnProperty(vmap.color)) {
            $p.uniform.uColorMode = 0;
        } else {
            $p.uniform.uColorMode = 1;
        }
    }

    if(typeof(opacity) === 'number') {
        $p.uniform.uDefaultAlpha.data = opacity;
    } else if(vmapIndex[3] === -1 &&
        typeof(opacity) == 'string' &&
        opacity == 'auto'
    ) {
        $p.revealDensity = true;
        $p.uniform.uRevealMode.data = 0;
    }

    //Check if need interleaving data attributes(e.g.,parallel coordinates)
    if(Array.isArray(vmap.x) || Array.isArray(vmap.y)) {
        $p.renderMode = 'interleave';
        if(Array.isArray(vmap.x)){
            // vmap.x = vmap.x.reverse();
            $p.uniform.uInterleaveX = 0;
        }
        if(Array.isArray(vmap.y)) $p.uniform.uInterleaveX = 1;
    } else if(vmap.mark && ['rect', 'bar'].indexOf(vmap.mark) !== -1) {
        $p.renderMode = 'polygon';
    }

    if(vmapIndex[6] === -1 && typeof(vmap.size) == 'number') {
        $p.uniform.uMarkSize = vmap.size;
    }

    var viewSetting = {};
    var isRect = (['rect', 'bar'].indexOf(vmap.mark) !== -1);
    var markSpace = [0, 0];
    if(vmapIndex[0] > -1) {
        var len = $p.fieldWidths[vmapIndex[0]],
            ext = $p.fieldDomains[vmapIndex[0]];
        if($p.categoryLookup.hasOwnProperty(vmap.x)){
            viewSetting.scaleX = 'categorical';
             viewSetting.domainX = new Array(len).fill(0).map(
                 (d,i)=>$p.categoryLookup[vmap.x][i]
             );
         } else if (isRect) {
             viewSetting.scaleX = 'ordinal';
             viewSetting.domainX = new Array(len).fill(0).map((d,i)=>ext[0] + i);
         }
         markSpace[0] = 0.02;
    }
    if(vmapIndex[1] > -1) {
        var len = $p.fieldWidths[vmapIndex[1]],
            ext = $p.fieldDomains[vmapIndex[1]];

        if($p.categoryLookup.hasOwnProperty(vmap.y)){
             viewSetting.scaleY = 'categorical';
             viewSetting.domainY = new Array(len).fill(0).map(
                 (d,i)=>$p.categoryLookup[vmap.y][i]
             ).reverse();
        } else if (isRect) {
            viewSetting.scaleY = 'ordinal';
            viewSetting.domainY = new Array(len).fill(0).map((d,i)=>ext[0] + i).reverse();
        }
        markSpace[1] = 0.02;
    }

    if(vmapIndex[0] > -1 && vmapIndex[1] > -1) {
        markSpace = [0, 0];
    }

    $p.uniform.uMarkSpace.data = markSpace;

    if($p.intervals.hasOwnProperty(vmap.x) || $p.intervals.hasOwnProperty(vmap.y)) {
        var histDim = vmap.x || vmap.y,
            histMin = $p.intervals[histDim].min,
            histMax = $p.intervals[histDim].max,
            histIntv = $p.intervals[histDim].interval,
            histBin = (histMax - histMin) / histIntv;

        // viewSetting.fields = $p.fields;
        viewSetting.isHistogram = true;
        // viewSetting.domain = {};
        viewSetting.domainX = new Array(histBin).fill(histMin).map(function(h, i) {return h + i*histIntv});
    }

    if(!$p._update) {
        if(!vmap.width && vmap.x) {
            $p.uniform.uDefaultWidth.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)] );
        } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultWidth.data = vmap.width / width;
        }

        if(!vmap.height && vmap.y) {
            $p.uniform.uDefaultHeight.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)] );
        } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultHeight.data = vmap.height / height;
        }
    }
    return viewSetting;
}


/***/ }),
/* 36 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = brush;
function brush(arg){

    var option = arg || {},
        container = option.container || this.svg[0],
        width = option.width || this.width,
        height = option.height || this.height,
        x = function(s) {return s},
        y = function(s) {return s},
        base = option.base || null,
        selectX = option.x || false,
        selectY = option.y || false,
        border = option.border || "#FFF",
        color = option.color || "#111",
        brush = option.brush || function() {},
        brushstart = option.brushstart || function() {},
        brushend = option.brushend || function() {};

    if(typeof(selectX) === "function") {
        x = selectX;
        selectX = true;
    }
    if(typeof(selectY) === "function") {
        y = selectY;
        selectY = true;
    }
    if(base === null){
        base = container.append("g").attr("class", "selector");
    } else {
        base = container;
    };

    base.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill-opacity", 0)
        .attr("stroke", "none")
        .css("cursor", "crosshair");

    var selector = base.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", 0)
        .attr("fill-opacity", 0.1)
        .css("fill", color)
        .css("stroke", border)
        .css("cursor", "move");

    var sx, sy,
        dx, dy,
        bx, by,
        selection = {},
        intStart = false,
        drag = false;

    base.svg.addEventListener("mousedown", function(evt){
        evt.preventDefault();
        brushstart.call(this);
        intStart = true;
        sx = evt.clientX;
        sy = evt.clientY;

        var sp = selector.svg.getBoundingClientRect();
        var box = base.svg.getBoundingClientRect();
        var x0, y0, nw, nh;

        if(sx>sp.left && sy>sp.top && sx<sp.left+sp.width && sy<sp.top+sp.height) {
            drag = true;
            bx = sp.left;
            by = sp.top;
        }

        if(!drag){
            x0 = selectX ? sx - box.left : 0;
            y0 = selectY ? sy - box.top : 0;
            selector.attr("x", x0)
                .attr("y", y0)
                .attr("width", 0);
        }

        ondrag = function(evt){
            if(intStart){
                dx = evt.clientX - sx;
                dy = evt.clientY - sy;
                var selectorBox = selector.svg.getBoundingClientRect();
                if(drag){

                    var nx = bx + dx-box.left,
                        ny = by + dy-box.top;

                    if(bx+dx < box.left) nx = 0;
                    if(bx+dx+selectorBox.width > box.right) nx = width - selectorBox.width ;
                    if(by+dy < box.top) ny = 0;
                    if(by+dy+selectorBox.height > box.bottom) ny = height - selectorBox.height;
                    selector.attr("x", nx).attr("y", ny);
                } else {
                    if(evt.clientX < box.left) dx = box.left - sx;
                    if(evt.clientX > box.right) dx = box.right - sx;
                    if(evt.clientY > box.bottom) dy = box.bottom - sy;
                    if(evt.clientY < box.top) dy = box.top - sy;

                    x0 = selectX ? sx + dx - box.left: 0;
                    y0 = selectY ? sy + dy - box.top : 0;
                    nw = selectX ? Math.abs(dx) : width;
                    nh = selectY ? Math.abs(dy) : height;

                    if(dx<0 && dy>=0) selector.attr("x", x0);
                    if(dy<0 && dx>=0) selector.attr("y", y0);
                    if(dx<0 && dy<0) selector.attr("x", x0).attr("y", y0);
                    selector.attr("width", nw).attr("height", nh);
                }
                if(selectX) {
                    selection.x = [ x(selectorBox.left - box.left ), x(selectorBox.right - box.left )];
                }
                if(selectY) {
                    selection.y = [y(selectorBox.top - box.top), y(selectorBox.bottom - box.top)];
                }
                brush.call(this, selection);
            }
        };

        window.addEventListener("mousemove", ondrag, false);
        window.addEventListener("mouseup", function(evt){
            if(intStart){
                ondrag(evt);
                intStart = false;
                if(drag){
                    drag = false;
                }
            }
            brushend.call(this, selection);
            window.removeEventListener("mousemove", ondrag, false);
        }, false);
    });
};


/***/ }),
/* 37 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = layout;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__svg__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__chart__ = __webpack_require__(38);



function assign(object, source) {
    Object.keys(source).forEach(function(key) {
        object[key] = source[key];
    });
}
var defaultProperties = {
    width: 400,
    height: 300,
    padding: {left: 0, right: 0, top: 0, bottom: 0},
}

function layout(arg){
    "use strict";

    /* Private */
    var viz = this,
        option = arg || {},
        container = option.container || document.body,
        style = option.style || null,
        layers = [];

    this.width = container.clientWidth || 400;
    this.height = container.clientHeight || 300;

    if(typeof container == 'string') container = document.getElementById(container);
    assign(viz, defaultProperties);
    assign(viz, option);

    this.vmap = option.vmap;

    this.width -= (this.padding.left + this.padding.right);
    this.height -= (this.padding.top + this.padding.bottom);


    /* Public */
    this.data = option.data || [];
    this.div = document.createElement("div");
    if(style !== null) {
        Object.keys(style).forEach(function(prop){
            viz.div.style[prop] = style[prop];
        })
    }

    this.init = function(){
        // container = (containerId == "body") ? document.body : document.getElementById(containerId);

        this.div.className = option.className || "p6-viz";
        this.div.style.position = 'relative';
        this.resize(
            this.width + this.padding.left + this.padding.right,
            this.height + this.padding.top + this.padding.bottom
        );

        if(option.style) this.css(option.style);

        container.appendChild(this.div);
        this.viz();
        return viz;
    };

    this.createSVG = function(arg) {
        var arg = arg || {},
            width = arg.width || this.width,
            height = arg.height || this.height,
            padding = arg.padding || this.padding;

        return new __WEBPACK_IMPORTED_MODULE_0__svg__["a" /* default */]({
            width: width,
            height: height,
            padding: padding,
            style: {position: 'absolute'}
        });
    }

    var canvas = option.canvas,
        svg = this.createSVG(),
        vmap = option.vmap,
        chartPadding = this.padding || {left: 0, right: 0, top: 0, bottom: 0},
        domain = option.domain || {x: [0, 1000], y: [0, 1]},
        scales = option.scales || {x: 'linear', y: 'linear'};

    var backSVG = this.createSVG(),
        frontSVG = this.createSVG();

    this.set = function(props) {
        assign(viz, props);
    };

    this.addProperty = function(obj, prop) {
        assign(obj, prop);
        return obj;
    }

    this.viz = function() {
        viz.div.appendChild(backSVG.svg);
        viz.div.appendChild(canvas);
        viz.div.appendChild(frontSVG.svg);
        return viz;
    };

    this.render = this.viz;

    this.css = function(style){
        for(var key in style){
            this.div.style[key] = style[key];
        }
        return this;
    };

    this.resize = function(w,h){
        this.div.style.width = w + "px";
        this.div.style.height = h + "px";
    };

    this.destroy = function() {
        this._super.destroy();
        container.removeChild(this.div);
        div = null;
    };

    this.hide = function() {
        this.div.style.display = 'none';
    }

    this.show = function() {
        this.div.style.display = 'block';
    }

    this.innerWidth = function() {
        return this.width;
    }

    this.innerHeight = function() {
        return this.height;
    }

    this.addChart = function(options) {
        return Object(__WEBPACK_IMPORTED_MODULE_1__chart__["a" /* default */])(frontSVG, options)
    };

    this.exportImage = function(beforeExport) {
        var imageCanvas = document.createElement("canvas");
        imageCanvas.width = this.width;
        imageCanvas.height = this.height;
        return new Promise(function(resolve, reject) {

            var ctx = imageCanvas.getContext("2d");
            var svgString = new XMLSerializer().serializeToString(frontSVG.svg);

            var DOMURL = self.URL || self.webkitURL || self;
            var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
            var svgURL = DOMURL.createObjectURL(svgBlob);

            var canvasLayer = new Image();
            var svgLayer = new Image();
            canvasLayer.onload = function() {
                ctx.drawImage(canvasLayer, 0, 0);
                svgLayer.src = svgURL;
                svgLayer.onload = function() {
                    ctx.drawImage(svgLayer, 0, 0);
                    var png = imageCanvas.toDataURL("image/png");
                    DOMURL.revokeObjectURL(png);
                    resolve(png);
                };
            };

            canvasLayer.onerror = function() {
                reject(Error("Canvas Output Error!"));
            }

            svgLayer.onerror = function() {
                reject(Error("SVG Output Error!"));
            }
            beforeExport();
            canvasLayer.src = canvas.toDataURL("image/png");
        });

    }

    return viz.init();
};


/***/ }),
/* 38 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = chart;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__axis__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__format__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__scale__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__legend__ = __webpack_require__(40);





function chart(svg, arg) {
    var options = arg || {},
        plot = svg.append('g'),
        width = options.width,
        height = options.height,
        top = options.top || 0,
        left = options.left || 0,
        vmap = options.vmap || {},
        isHistogram = options.isHistogram || options.hist || false,
        features = options.fields || [],
        domain = options.domain,
        categories = options.categories,
        labels = plot.append('g'),
        onclick = options.onclick || null,
        onhover = options.onhover || null,
        showLegend = options.legend || true,
        tickOffset = options.axisOffset || [0, 0],
        padding = options.padding || {left: 0, right: 0, top: 0, bottom: 0},
        marks = [],
        colors = options.colors;

    var scaleX = options.scaleX || 'linear',
        domainX = options.domainX || domain[vmap.x] || domain[vmap.width],
        scaleY = options.scaleY || 'linear',
        domainY = options.domainY || domain[vmap.y] || domain[vmap.height];

    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var xAxisOption = {
        container: plot,
        dim: "x",
        width: width,
        height: height,
        domain: domainX,
        scale:  scaleX,
        align: "bottom",
        // ticks: 5,
        // grid: 1,
        format: Object(__WEBPACK_IMPORTED_MODULE_1__format__["a" /* default */])(".3s"),
    };

    var yAxisOption = {
        container: plot,
        dim: "y",
        domain: domainY,
        scale: scaleY,
        width: width,
        height: height,
        align: "left",
        // labelPos: {x: -5, y: -5},
        // grid: 1,
        format: Object(__WEBPACK_IMPORTED_MODULE_1__format__["a" /* default */])(".3s"),
    };

    if(showLegend && features.indexOf(vmap.color) !== -1){
        Object(__WEBPACK_IMPORTED_MODULE_3__legend__["a" /* default */])({
            container: plot,
            width: 20,
            height: 180,
            dim: "y",
            domain: domain[vmap.color],
            pos: [width + padding.right/2, 0],
            colors: colors
        });
    }

    if(scaleX == 'ordinal' || scaleX == 'categorical') {
        xAxisOption.ticks = domainX.length;
        while(width / xAxisOption.ticks < 20) {
            xAxisOption.ticks *= 0.5;
        }
        var maxStrLength = Math.max.apply(null, domainX.map(
            function(d){ return (typeof(d) == 'string') ? d.toString().length : 1; })
        );
        if(maxStrLength > 10) {
            xAxisOption.labelAngle = -30;
            xAxisOption.tickLabelAlign = 'end';
            xAxisOption.labelPos = {x: 0, y: -10};
        }
    }

    if(scaleY == 'ordinal' || scaleY == 'categorical') {
        yAxisOption.ticks = domainY.length;
        while(width / yAxisOption.ticks < 20) {
            yAxisOption.ticks *= 0.5;
        }
    }

    var x, y, xAxes = [], yAxes = [];

    // For parallel coordinates
    if(Array.isArray(vmap.x)) {
        var axisDist = height / (vmap.x.length-1);

        vmap.x.forEach(function(d, i) {
            xAxisOption.position = i * axisDist + 1;
            xAxisOption.domain = domain[d];
            if(categories.hasOwnProperty(d)){
                xAxisOption.scale = 'ordinal';
                xAxisOption.tickAlign = 'outer';
                xAxisOption.domain = categories[d].reverse();
            }
            var labelOffset = 20;
            if(i === 0) {
                xAxisOption.tickPosition = [0, -5];
                xAxisOption.labelPos = {x: 0, y: 2};
                labelOffset = 35;
            } else {
                xAxisOption.tickPosition = null;
                xAxisOption.labelPos = null;
            }
            x = Object(__WEBPACK_IMPORTED_MODULE_0__axis__["a" /* default */])(xAxisOption);
            xAxes[i] = x;

            labels
            .append("text")
              .attr("x", 5 )
              .attr("y", i * axisDist - labelOffset)
              .attr("dy", "1em")
              .css("text-anchor", "middle")
              .css("font-size", "1em")
              .text(d);
        });
    }

    if(Array.isArray(vmap.y)) {
        var axisDist = width / (vmap.y.length-1);

        vmap.y.forEach(function(d, i) {
            yAxisOption.position = i * axisDist;
            yAxisOption.domain = domain[d];
            if(categories.hasOwnProperty(d)){
                yAxisOption.scale = 'ordinal';
                yAxisOption.tickAlign = 'outer';
                yAxisOption.domain = categories[d].reverse();
            }
            if(i == vmap.y.length-1) {
                yAxisOption.tickPosition = [5, 0];
                yAxisOption.tickLabelAlign = "start";
                yAxisOption.labelPos = {x: 8, y: -5};

            }
            y = Object(__WEBPACK_IMPORTED_MODULE_0__axis__["a" /* default */])(yAxisOption);
            yAxes[i] = y;

            labels.append("text")
              .attr("y", -padding.top + 10)
              .attr("x", i * axisDist)
              .attr("dy", "1em")
              .css("text-anchor", "middle")
              .css("font-size", "1em")
              .text(d);
        });
    }

    if(isHistogram) {
        xAxisOption.tickPosition = [width / domainX.length /2, 0];
        xAxisOption.scale = "ordinal";
        xAxisOption.domain = domainX;
        xAxisOption.ticks = domainX.length;
    }

    if((vmap.x || vmap.width) && !Array.isArray(vmap.x)) x = Object(__WEBPACK_IMPORTED_MODULE_0__axis__["a" /* default */])(xAxisOption);
    if((vmap.y || vmap.height) && !Array.isArray(vmap.y)) y = Object(__WEBPACK_IMPORTED_MODULE_0__axis__["a" /* default */])(yAxisOption);

    if((vmap.hasOwnProperty('x') || vmap.hasOwnProperty('width')) && !Array.isArray(vmap.x)) {
        var xAxisTitle = vmap.x || vmap.width;
        // xAxisTitle = xAxisTitle.replace(/_/g, ' ');
        // xAxisOption.grid = 1;
        labels.append("g")
          .append("text")
            .attr("x", width/2)
            .attr("y", height + padding.bottom/2 )
            .attr("dy", "1em")
            .css("text-anchor", "middle")
            .css("font-size", "1.0em")
            .css("font-weight", "bold")
            .css(" text-transform", "capitalize")
            .text(xAxisTitle);

    }
    if((vmap.hasOwnProperty('y') || vmap.hasOwnProperty('height')) && !Array.isArray(vmap.y)) {
        var yAxisTitle = vmap.y || vmap.height;
        // yAxisTitle = yAxisTitle.replace(/_/g, ' ');
        // yAxisOption.grid = 1;
        if(!Array.isArray(vmap.y)) {
            labels.append("g")
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -padding.left/1.25 )
                .attr("x", -height/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .css("font-size", "1.0em")
                .css("font-weight", "bold")
                .css(" text-transform", "capitalize")
                .text(yAxisTitle);
        }
    }
    // plot.append("line")
    //     .attr('x1', 0)
    //     .attr('x2', width)
    //     .attr('y1', 0)
    //     .attr('y2', 0)
    //     .css('stroke', '#000')
    // plot.append("line")
    //     .attr('x1', width)
    //     .attr('x2', width)
    //     .attr('y1', 0)
    //     .attr('y2', height)
    //     .css('stroke', '#000')
        // .css('stroke-opacity', 0.5)

    plot.translate(padding.left+left, padding.top+top);

    var chartLayer = {};

    chartLayer.update =  function(spec) {
        var data = spec.data || [];

        if(data.length) {
            data.forEach(function(d, i){
                var barHeight = isFinite(y(d[vmap.y])) ? y(d[vmap.y]) : height;
                if(hMarks[i]) {
                    hMarks[i].Attr({
                        y: barHeight,
                        height: height - barHeight,
                        fill: "orange"
                    });
                }
            })
        } else {
            hMarks.forEach(function(h, i){
                h.Attr({ y: 0, height: 0 });
            })
        }
    }

    chartLayer.removeAxis = function() {
        x.remove();
        y.remove();
        if(yAxes.length) {
            yAxes.forEach(function(yp) {
                yp.remove();
            })
        }
    }

    chartLayer.svg = plot;
    chartLayer.x = Array.isArray(vmap.x) ? xAxes : x;
    chartLayer.y = Array.isArray(vmap.y) ? yAxes : y;

    return chartLayer;
};


/***/ }),
/* 39 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export reduce */
/* unused harmony export avg */
/* unused harmony export normalize */
/* harmony export (immutable) */ __webpack_exports__["a"] = seq;
/* unused harmony export scan */
/* unused harmony export iscan */
/* unused harmony export diff */
/* unused harmony export intersect */
/* unused harmony export unique */
/* unused harmony export lcm */
/* unused harmony export stats */
/* unused harmony export histogram */
/* unused harmony export variance */
/* unused harmony export std */
/* unused harmony export vectorAdd */
/* unused harmony export vectorSum */
/* unused harmony export vectorAvg */
function _reduce(array, opt) {
    var i,
        len = array.length,
        fn,
        result;

    if (!len) return 0;

    switch (opt) {
        case "max":
            result = array.reduce(function(a, b) {
                return (a > b) ? a : b;
            });
            break;
        case "min":
            result = array.reduce(function(a, b) {
                return (a < b) ? a : b;
            });
            break;
        case "and":
        case "&":
            result = array.reduce(function(a, b) {
                return a & b;
            });
            break;
        case "or":
        case "|":
            result = array.reduce(function(a, b) {
                return a | b;
            });
            break;
        case "mult":
        case "*":
            result = array.reduce(function(a, b) {
                return a * b;
            });
            break;
        default: // "sum" or "+"
            result = array.reduce(function(a, b) {
                return a + b;
            });
            break;
    }

    return result;
}

function reduce(opt) {
    return function(array) {
        var a = (array instanceof Array) ? array : Array.apply(null, arguments);
        return _reduce(a, opt);
    };
};

function avg(array) {
    return _reduce(array, "+") / array.length;
    // return array.reduce(function(a,b){ return 0.5 * (a + b)});
};

function normalize(array) {
    var max = _reduce(array, "max"),
        min = _reduce(array, "min"),
        range = max - min;

    return array.map(function(a) {
        return (a - min) / range;
    });
}

function seq(start, end, intv) {
    var interval = intv || 1,
        array = [];

    for (var i = start; i <= end; i += interval)
        array.push(i);

    return array;
};

// ["max", "min", "mult", "and", "or"].forEach(function(f) {
//     array[f] = array.reduce(f);
// });

// export sum = array.reduce("+");

function scan(a) {
    var pfsum = [],
        accum = 0;

    for (var i = 0; i < a.length; i++) {
        accum += a[i];
        pfsum.push(accum);
    }

    return pfsum;
};

function iscan(a) {
    return array.scan([0].concat(a));
};

function diff(a, b) {
    var difference = [];
    a.forEach(function(d) {
        if (b.indexOf(d) === -1) {
            difference.push(d);
        }
    });
    return difference;
};

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function(e) {
        if (b.indexOf(e) !== -1) return true;
    });
};

function unique(a) {
    return a.reduce(function(b, c) {
        if (b.indexOf(c) < 0) b.push(c);
        return b;
    }, []);
};

function lcm(A) {
    var n = A.length,
        a = Math.abs(A[0]);
    for (var i = 1; i < n; i++) {
        var b = Math.abs(A[i]),
            c = a;
        while (a && b) {
            (a > b) ? a %= b: b %= a;
        }
        a = Math.abs(c * A[i]) / (a + b);
    }
    return a;
};

function stats(array) {
    return {
        max: _reduce(array, "max"),
        min: _reduce(array, "min"),
        avg: array.avg(array)
    };
};

function histogram(array, numBin, _max, _min) {
    var l = array.length,
        min = (typeof(_min) == 'number') ? _min : _reduce(array, "min"),
        max = (typeof(_max) == 'number') ? _max : _reduce(array, "max"),
        range = max - min,
        interval = range / numBin,
        bins = [],
        // ids = [],
        hg = new Array(numBin + 1).fill(0);

    for (var b = 0; b < numBin; b++) {
        bins.push([min + range * (b / (numBin)), min + range * (b + 1) / (numBin)]);
        // ids[b] = [];
    }

    // ids[numBin] = [];

    for (var i = 0; i < l; i++) {
        binID = Math.floor((array[i] - min) / range * (numBin));
        hg[binID]++;
        // ids[binID].push(i);
    };

    hg[numBin - 1] += hg[numBin];
    // ids[numBin-1] = ids[numBin-1].concat(ids.pop());
    return {
        bins: bins,
        counts: hg.slice(0, numBin),
        // ids: ids
    };
}

function variance(rowArray) {
    var m = _reduce(rowArray, "+") / rowArray.length,
        va = rowArray.map(function(a) {
            return Math.pow(a - m, 2)
        });

    return _reduce(va, "+") / (rowArray.length - 1);
}

function std(rowArray) {
    return Math.sqrt(array.var(rowArray));
}

function vectorAdd(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = v + b[i];
    });

    return c;
}

function vectorSum(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = array.vectorAdd(result, vectors[i]);
    }

    return result;
}

function _vectorAvg(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = (v + b[i]) * 0.5;
    });

    return c;
}

function vectorAvg(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = _vectorAvg(result, vectors[i]);
    }

    return result;
}


/***/ }),
/* 40 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = color;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__svg__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__axis__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__format__ = __webpack_require__(11);




const defaultColors = ['white', 'steelblue'];
const defaultSize = 20;
var gradID = 0;

function color(arg){
    var gradientID = gradID++;

    var option = arg || {},
        container = option.container || null,
        width = option.width || null,
        height = option.height || null,
        pos = option.pos ||[0, 0],
        dim = option.dim || 'x',
        padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0},
        vmap = option.vmap || {},
        label = option.label || false,
        colors = option.colors || defaultColors,
        domain = option.domain || ['min', 'max'],
        format = option.format || Object(__WEBPACK_IMPORTED_MODULE_2__format__["a" /* default */])('.3s');


    if(colors.length < 2) colors = defaultColors;
    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var legend = (container === null)
        ? new __WEBPACK_IMPORTED_MODULE_0__svg__["a" /* default */]({width: width, height: height, padding: padding})
        : container.append('g');

    var gradDirection;
    if(dim == 'x') {
        gradDirection = {x1: 0, x2: 1, y1: 0, y2: 0};
        if(height === null) height = defaultSize;
    } else {
        gradDirection = {x1: 0, x2: 0, y1: 0, y2: 1};
        if(width === null) width = defaultSize;
    }

    function linearGradient(colors) {
        var gradient = legend.append('defs')
            .append('linearGradient')
                .attr('id', 'gradlegend'+gradientID)
                .attr(gradDirection);

        colors.forEach(function(c, i){
            gradient.append('stop')
                .attr('offset', i / (colors.length-1) )
                .attr('stop-color', colors[colors.length-i-1]);
        });
        return gradient;
    }

    var grad = linearGradient(colors);

    var rect = legend.append('g');

    var colorScale = rect.append('rect')
        .attr('width', width-padding.left)
        .attr('height', height)
        .style('fill','url(#gradlegend' + gradientID + ')');

    var domainLabel = legend.append('text');
    if(label) {
        label.append('text')
            .attr('x', pos[0] - 5)
            .attr('y', pos[1] + height/2 + 5)
            .style('fill', '#222')
            .style('text-anchor', 'end')
            .text(Object(__WEBPACK_IMPORTED_MODULE_2__format__["a" /* default */])('2s')(domain[0]));

        legend.append('text')
            .attr('x', pos[0] + width - padding.left + 5)
            .attr('y', pos[1] + height/2 + 5)
            .style('fill', '#222')
            .style('text-anchor', 'begin')
            // .style('font-size', '.9em')
            .text(Object(__WEBPACK_IMPORTED_MODULE_2__format__["a" /* default */])('2s')(domain[1]));
    }

    if(option.title) {
        legend.append('g')
          .append('text')
            .attr('y', pos[1] - padding.top)
            .attr('x', pos[0] + width/2)
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(option.title);
    }

    if(dim == 'x') {
        new __WEBPACK_IMPORTED_MODULE_1__axis__["a" /* default */]({
            dim: 'x',
            domain: domain,
            container: legend,
            align: 'bottom',
            ticks: Math.floor(width / 30),
            height: height,
            width: width,
            labelPos: {x: 0, y: -20},
            format: format,
        });
    } else {
        new __WEBPACK_IMPORTED_MODULE_1__axis__["a" /* default */]({
            dim: 'y',
            domain: domain,
            container: legend,
            align: 'right',
            ticks: Math.floor(height / 30),
            height: height,
            width: width,
            labelPos: {x: 0, y: -20},
            format: format,
        });
    }


    // legend.appendChild(xAxis);

    legend.translate(pos[0]+padding.left, pos[1]+padding.top);

    // legend.update = function(newDomain, newColors) {
    //
    //     legend.removeChild(xAxis);
    //     xAxis = new Axis({
    //         dim: 'x',
    //         domain: newDomain,
    //         container: legend,
    //         align: 'bottom',
    //         ticks: 4,
    //         // tickInterval: 10000000,
    //         labelPos: {x: -5, y: -20},
    //          padding: padding,
    //         width: width-padding.left,
    //         format: format,
    //     }).show();
    //
    //     if(typeof(newColors) != 'undefined') {
    //         grad.remove();
    //         grad = linearGradient(newColors);
    //         colorScale.css('fill','url(#gradlegend' + gradientID + ')');
    //
    //     }
    //     // legend.appendChild(xAxis);
    //
    //     return legend;
    // }

    return legend;
}


/***/ }),
/* 41 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ColumnStore;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ctypes__ = __webpack_require__(0);

function ColumnStore(option){
    var cstore   = (this instanceof ColumnStore) ? this : {},
        columns  = [],                  // column-based binary data
        size     = option.size  || 0,   // max size
        count    = option.count || 0,   // number of entries stored
        types    = option.types || [],  // types of the columns
        attributes = option.attributes || option.keys || option.names || [],  // column attributes
        struct   = option.struct|| option.schema || {},
        CAMs     = option.CAMs  || {},  // content access memory
        TLBs     = option.TLBs  || {},  // table lookaside buffer
        colStats = {},
        colAlloc = {},
        colRead  = {},                  // functions for reading values
        skip     = option.skip  || 0;

    if(option.struct) initStruct(option.struct);

    function initCStore() {
        if(size && types.length === attributes.length && types.length > 0) {
            attributes.forEach(function(c, i){
                configureColumn(i);
                columns[i] = new colAlloc[c](size);
                if(!columns.hasOwnProperty(c))
                    Object.defineProperty(columns, c, {
                        get: function() { return columns[i]; }
                    });
            });
            columns.attributes = attributes;
            columns.keys = attributes;
            columns.types = types;
            columns.struct = struct;
            columns.TLBs = TLBs;
            columns.CAMs = CAMs;
            columns.size = size;
            columns.get = function(c) {
                var index = attributes.indexOf(c);
                if(index < 0 ) throw new Error("Error: No column named " + c);
                return columns[index];
            }
        }
        return cstore;
    }

    function initStruct(s) {
        struct = s;
        if(Array.isArray(struct)) {
            struct.forEach(function(s){
                attributes.push(s.name);
                types.push(s.type);
            })
        } else {
            for(var k in struct){
                attributes.push(k);
                types.push(struct[k]);
            }
        }
        return initCStore();
    }

    function configureColumn(cid) {
        if(typeof(cid) == "string") cid = attributes.indexOf(cid);
        var f = attributes[cid];
        colAlloc[f] = __WEBPACK_IMPORTED_MODULE_0__ctypes__[types[cid]];

        if(colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["string"]){
            TLBs[f] = [];
            CAMs[f] = {};
            colRead[f] = function(value) {
                if(!CAMs[f].hasOwnProperty(value)){
                    CAMs[f][value] = TLBs[f].length;
                    TLBs[f].push(value);
                }
                return CAMs[f][value];
            };
        } else if(
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["int"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["short"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["integer"]
        ) {
            colRead[f] = function(value) {  return parseInt(value) || 0; };
        } else if(
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["float"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["double"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["numeric"]
        ){
            colRead[f] = function(value) {  return parseFloat(value) || 0.0; };
        } else if(
                colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["time"] ||
                colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["temporal"]
        ) {
            colRead[f] = function(value) {  return parseFloat(value) || 0.0; };
        } else {
            throw new Error("Invalid data type for TypedArray data!")
        }
    }

    cstore.addRows = function(rowArray) {
        if(count === 0 && skip > 0) {
            for(var j = 0; j<skip; j++)
                rowArray.shift();
        }
        rowArray.forEach(function(row, i){
            row.forEach(function(v,j){
                columns[j][count] = colRead[attributes[j]](v);
            });
            count++;
        });
        return count;
    }

    cstore.addColumn = function(arg) {
        var props = arg || {},
            columnData = props.data || props.array,
            columnName = props.name,
            columnType = props.dtype,
            values = props.values || [];

        var cid = attributes.indexOf(columnName);
        if( cid < 0) {
            attributes.push(columnName);
            types.push(columnType);
            configureColumn(columnName);
            cid = types.length - 1;
            Object.defineProperty(columns, columnName, {
                get: function() { return columns[cid]; }
            });
        }

        if(columnData instanceof __WEBPACK_IMPORTED_MODULE_0__ctypes__[types[cid]]) {
            columns[cid] = columnData;
            if(values.length) {
                TLBs[columnName] = values;
                CAMs[columnName] = {};
                values.forEach(function(value, vi){
                    CAMs[columnName][value] = vi;
                })
            }
        } else if(ArrayBuffer.isView(columnData)){
            columns[cid] = new colAlloc[columnName](size);
            for(var di = 0; di < size; di++) {
                columns[cid][di] = colRead[columnName](columnData[di]);
            }
        } else {
            throw new Error("Error: Invalid data type for columnArray!");
        }
        size = count = columnData.length;
    }

    cstore.metadata = cstore.info = function() {
        return {
            size: size,
            count: count,
            attributes: attributes,
            types: types,
            TLBs: TLBs,
            CAMs: CAMs,
            stats: cstore.stats()
        }
    }

    cstore.data = cstore.columns = function() {
        return columns;
    }

    cstore.stats = function(col){
        var col = col || attributes;
        col.forEach(function(name, c){
            if(!colStats[c]){
                var min, max, avg;
                min = max = avg = columns[c][0];

                for(var i = 1; i < columns[c].length; i++){
                    var d = columns[c][i];
                    if(d > max) max = d;
                    else if(d < min) min = d;
                    avg = avg - (avg-d) / i;
                }
                if(max == min) max += 0.000001;
                colStats[name] = {min: min, max: max, avg: avg};
            }
        })
        return colStats;
    }

    cstore.domains = function(col){
        var col = col || attributes,
            domains = [];

        col.forEach(function(name, c){
            domains[name] = [colStats[name].min, colStats[name].max];
        })
        return domains;
    }

    cstore.ctypes = function() {
        return __WEBPACK_IMPORTED_MODULE_0__ctypes__;
    }

    cstore.size = size;

    return initCStore();
}


/***/ }),
/* 42 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["request"] = request;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (immutable) */ __webpack_exports__["getAll"] = getAll;
/* harmony export (immutable) */ __webpack_exports__["post"] = post;
function request(arg) {
    var url = arg.url || arg,
        method = arg.method || "GET",
        dataType = arg.dataType || "json",
        data = arg.data || [],
        query = [];  //arraybuffer, blob, document, json, text

    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    return new Promise(function(resolve, reject) {

        var req = new XMLHttpRequest();
        req.open(method, url);
        req.responseType = dataType;

        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            reject(Error(req.statusText));
          }
        };

        req.onerror = function() {
          reject(Error("Network Error"));
        };

        if (method == 'POST') {
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }

        req.send(data);
    });
};

let get = request;

function getAll(options) {
    var promises = [];
    options.forEach(function(option){
        promises.push(
            ajax.get(option)
            .then(function(result){
                return new Promise(function(resolve, reject) {
                    resolve(result);
                });
            })
        );
    });

    return Promise.all(promises);
}

function post(arg) {
    arg.method = "POST";
    return ajax.request(arg);
};


/***/ }),
/* 43 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = parse;
function parse(text, delimiter) {
    "use strict";
    var size = text.length,
        accum = 0,
        i, //index for starting of a line
        row,
        rows = [],
        fields = [],
        lens = [],
        EOL = false;

    while(accum < size) {
        i = accum, EOL = false;
        row = loadLine(text, delimiter.charCodeAt(0), i);
        rows.push(row.fields);
        accum += row.size;
    }
    return rows;
}

function loadLine(text, delimiterCode, initPos) {
    // if(typeof(initPos) === 'undefined') initPos = 0;
    var EOL = false,
        QUOTE = false,
        c = initPos, //current pos
        code, //code at c
        f = initPos, // start pos of current field
        q, //start pos of quote
        fields = [],
        L = text.length;

    while(!EOL){
        code = text.charCodeAt(c);
        if(code === 10 || c>=L){
            EOL = true;
            // if(text.charCodeAt(c+1) === 13) ++c;
            fields.push( text.slice(f, c) );
        } else {
            if(code === delimiterCode && !QUOTE) {
                // console.log(f,c, text.slice(f, c));
                var field = text.slice(f, c);
                fields.push( field );
                f = c+1;
            } else if(code === 34){
                if(QUOTE){
                    if(text.charCodeAt(c+1) === delimiterCode){
                        QUOTE = false;
                        fields.push(text.slice(q, c));
                        f = c+2;
                        c++;
                    }
                } else {
                    q = c+1;
                    QUOTE = true;
                }
            }
        }
        c++;
    }
    return { fields: fields, size: c-initPos };
}


/***/ })
/******/ ]);
//# sourceMappingURL=p6.js.map