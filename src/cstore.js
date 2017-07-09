if (typeof(define) !== 'function') var define = require('amdefine')(module);

define( function(require) {

    var ctypes = require('./ctypes');

    var query = {
        filter: require('./filter'),
    }
    var filter = require('./filter');

    return function ColumnStore(option){
        "use strict";
        var cstore   = (this instanceof ColumnStore) ? this : {},
            columns  = [],                  // column-based binary data
            size     = option.size  || 0,   // max size
            count    = option.count || 0,   // number of entries stored
            types    = option.types || [],  // types of the columns
            keys     = option.keys  || option.names || [],  // column keys
            semantics = option.semantics || [],
            struct   = option.struct|| {},
            CAMs     = option.CAMs  || {},  // content access memory
            TLBs     = option.TLBs  || {},  // table lookaside buffer
            colStats = {},
            colAlloc = {},
            colRead  = {},                  // functions for reading values
            skip     = option.skip  || 0;

        if(option.struct) initStruct(option.struct);

        function initCStore() {
            if(size && types.length === keys.length && types.length > 0) {
                keys.forEach(function(c, i){
                    configureColumn(i);
                    columns[i] = new colAlloc[c](size);
                    if(!columns.hasOwnProperty(c))
                        Object.defineProperty(columns, c, {
                            get: function() { return columns[i]; }
                        });
                });
                columns.keys = keys;
                columns.types = types;
                columns.struct = struct;
                columns.TLBs = TLBs;
                columns.CAMs = CAMs;
                columns.size = size;
                columns.get = function(c) {
                    var index = keys.indexOf(c);
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
                    keys.push(s.name);
                    types.push(s.type);
                    semantics.push(s.semantic || "numerical");
                })
            } else {
                for(var k in struct){
                    keys.push(k);
                    types.push(struct[k]);
                }
            }
            return initCStore();
        }

        function configureColumn(cid) {
            if(typeof(cid) == "string") cid = keys.indexOf(cid);
            var f = keys[cid];
            colAlloc[f] = ctypes[types[cid]];

            if(colAlloc[f] === ctypes.string){
                TLBs[f] = [];
                CAMs[f] = {};
                colRead[f] = function(value) {
                    if(!CAMs[f][value]){
                        TLBs[f].push(value);
                        CAMs[f][value] = TLBs[f].length;
                        return TLBs[f].length;
                    } else {
                        return CAMs[f][value];
                    }
                };
            } else if(
                colAlloc[f] === ctypes.int ||
                colAlloc[f] === ctypes.short ||
                colAlloc[f] === ctypes.integer
            ) {
                colRead[f] = function(value) {  return parseInt(value) || 0; };
            } else if(
                colAlloc[f] === ctypes.float ||
                colAlloc[f] === ctypes.double ||
                colAlloc[f] === ctypes.numeric
            ){
                colRead[f] = function(value) {  return parseFloat(value) || 0.0; };
            } else if(
                    colAlloc[f] === ctypes.time ||
                    colAlloc[f] === ctypes.temporal
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
            rowArray.forEach(function(row){
                row.forEach(function(v,j){
                    columns[j][count] = colRead[keys[j]](v);
                });
                count++;
            });
            return count;
        }

        cstore.addColumns = function(columnArray, columnName, columnType) {
            var cid = keys.indexOf(columnName);
            if( cid < 0) {
                keys.push(columnName);
                types.push(columnType);
                configureColumn(columnName);
                cid = types.length - 1;
                Object.defineProperty(columns, columnName, {
                    get: function() { return columns[cid]; }
                });
            }

            if(columnArray instanceof ctypes[types[cid]]) {
                columns[cid] = columnArray;
            } else if(ArrayBuffer.isView(columnArray)){
                columns[cid] = new colAlloc[columnName](columnArray);
            } else {
                throw new Error("Error: Invalid data type for columnArray!");
            }
            count = columnArray.length;
        }

        cstore.metadata = cstore.info = function() {
            return {
                size: size,
                count: count,
                keys: keys,
                names: keys,
                types: types,
                semantics: semantics,
                TLBs: TLBs,
                CAMs: CAMs,
                stats: cstore.stats()
            }
        }

        cstore.data = cstore.columns = function() {
            return columns;
        }

        cstore.stats = function(col){
            var col = col || keys;
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
            var col = col || keys,
                domains = [];

            col.forEach(function(name, c){
                domains[name] = [colStats[name].min, colStats[name].max];
            })
            return domains;
        }

        cstore.ctypes = function() {
            return ctypes;
        }

        cstore.size = size;

        cstore.filter = function(spec) {
            columns = filter(columns, spec);
            count = size = columns.rows;
            return cstore;
        }

        return initCStore();
    }
});
