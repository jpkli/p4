if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require){
    "use strict";
    var objId           = 1,
        protectedSpace  = {};

    function Base(){
        protectedSpace[objId] = {};
        this.objId = objId;
        // this._protected = function(){ return protectedSpace[objId]; };
        this.destroy = function(){ delete protectedSpace[this.objId]; };
        objId++;
    };

    if(!Object.create){
        Object.create = function createObject(proto) {
            function ctor() { }
            ctor.prototype = proto;
            return new ctor();
        };
    }

    function create(classFunction){
        return extend(Base, classFunction);
    }

    function _polymorph(childFunction, parentFunction) {
        return function () {
            var output;
            this.__super = parentFunction;
            output = childFunction.apply(this, arguments);
            delete this.__super;
            return output;
        };
    }

    function rename(classFunction, newClassName){
        var f = (new Function("return function(classX) { return function " + newClassName + "() { return classX(this, arguments) }; };")());
        return f(Function.apply.bind(classFunction));
    }

    function _protected(obj){
        return protectedSpace[obj.objId];
    }

    function extend(classBase, classFunction){
        function classX(option){
            this._super = {};
            classBase.call(this._super, option);
            this._protected = _protected(this._super);
            if(option.hasOwnProperty("debug") && option.debug) debug = true;

            for(var key in this._protected){
                if(!this.hasOwnProperty(key)){
                    this[key] = this._protected[key];
                }
            }

            for(var key in this._super){
                if(!this.hasOwnProperty(key)){
                    this[key] = this._super[key];
                }
                if(key[0] === "$" || key[0] === "_")
                    protectedSpace[this.objId][key] = this._super[key];
            }

            classFunction.call(this, option);

            for(var key in this){
                if(this.hasOwnProperty(key) && (key[0] === "$" || key[0] === "_"))
                    protectedSpace[this.objId][key] = this[key];
            }

            //prevent accessing protected variables from outside
            delete this._protected;
            var _super = this._super;
            for(var key in this){
                if(this.hasOwnProperty(key)  && (key[0] === "$" || key[0] === "_"))
                    delete this[key];
            }
            this._super = _super;

            return this;
        }

        if(classFunction.name)
            classX = rename(classX, classFunction.name);

        classX.prototype = Object.create(classBase.prototype);
        classX.prototype.constructor = classX;
        classX.extend = function(classFunction){
            return extend(classX, classFunction);
        };

        return classX;
    }

    var NewClass = {
        create: create,
        extend: extend,
        rename: rename,
        debug: false,
    };

    if(NewClass.debug){
        NewClass._protectedSpace = protectedSpace;
    }

    return NewClass;
});
