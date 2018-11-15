import * as ctypes from './ctypes';
import {unique} from './arrays';

export default function ColumnStore(arg){
    var cstore     = (this instanceof ColumnStore) ? this : {},
        options    = arg || {},
        columns    = [],                  // column-based binary data
        size       = options.size  || 0,   // max size
        count      = options.count || 0,   // number of entries stored
        types      = options.types || [],  // types of the columns
        attributes = options.attributes || options.keys || options.names || [],  // column attributes
        struct     = options.struct || options.schema || null,
        strHashes  = options.strHashes || {},  // content access memory
        strLists   = options.strLists  || {},  // table lookaside buffer
        intervals  = {},
        indexes    = options.indexes || {},
        colStats   = {},
        colAlloc   = {},
        colRead    = {},                  // functions for reading values
        skip       = options.skip  || 0;

    if(typeof(struct) === 'object') initStruct(struct);

    function initCStore() {
        if(size && types.length === attributes.length && types.length > 0) {
            attributes.forEach(function(c, i){
                configureColumn(i);
                columns[i] = new colAlloc[c](size);
                if(!columns.hasOwnProperty(c)) {
                    Object.defineProperty(columns, c, {
                        get: function() { return columns[i]; }
                    });
                }
                if(intervals.hasOwnProperty(c)) {
                    cstore.intervalize(c, intervals[c]);
                }
            });
            columns.attributes = attributes;
            columns.keys = attributes;
            columns.types = types;
            columns.struct = struct;
            columns.strLists = strLists;
            columns.strHashes = strHashes;
            columns.uniqueValues = indexes;
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
        return struct;
    }

    function configureColumn(cid) {
        if(typeof(cid) == "string") cid = attributes.indexOf(cid);
        var f = attributes[cid];
        colAlloc[f] = ctypes[types[cid]];

        if(colAlloc[f] === ctypes.string){
            strLists[f] = [];
            strHashes[f] = {};
            colRead[f] = function(value) {
                if(!strHashes[f].hasOwnProperty(value)){
                    strHashes[f][value] = strLists[f].length;
                    strLists[f].push(value);
                }
                return strHashes[f][value];
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
        if(size === 0) {
            size = rowArray.length;
            initCStore();
        }
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

    cstore.addObjects = function(objArray) {
        if(count === 0 && skip > 0) {
            for(var j = 0; j<skip; j++)
                objArray.shift();
        }
        objArray.forEach(function(obj, i){
            Object.keys(obj).forEach(function(v,j){
                columns[j][count] = colRead[attributes[j]](obj[v]);
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

        if(columnData instanceof ctypes[types[cid]]) {
            columns[cid] = columnData;
            if(values.length) {
                strLists[columnName] = values;
                strHashes[columnName] = {};
                values.forEach(function(value, vi){
                    strHashes[columnName][value] = vi;
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
            strLists: strLists,
            strHashes: strHashes,
            stats: cstore.stats()
        }
    }

    cstore.columns = function() {
        return columns;
    }

    cstore.data = function() {
        var data = columns;
        data.stats = cstore.stats();
        data.keys = attributes;
        data.size = size;
        data.strHashes = strHashes;
        data.strLists = strLists;
        data.dtypes = types;
        data.export = cstore.export;
        return data;
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
        return ctypes;
    }

    cstore.size = size;

    cstore.exportAsJSON = function() {
        var rows = new Array(size);
        for(var ri = 0; ri < size; ri++) {
            var dataFrame = {};
            attributes.forEach(function(attr, ai) {
                if(types[ai] == 'string') {
                    dataFrame[attr] = strLists[attr][columns[ai][ri]];
                } else {
                    dataFrame[attr] = columns[ai][ri];
                }
            })
            rows[ri] = dataFrame;
        }
        return rows;
    }

    cstore.exportAsRowArray = function() {
        var rows = new Array(size);
        for(var ri = 0; ri < size; ri++) {
            var row = new Array(attributes.length);
            attributes.forEach(function(attr, ai) {
                if(types[ai] == 'string') {
                    row[ai] = strLists[attr][columns[ai][ri]-1];
                } else {
                    row[ai] = columns[ai][ri];
                }
            })
            rows[ri] = row;
        }
        return rows;
    }

    cstore.export = function(arg) {
        var format = arg || 'json';
        if(format == 'rowArray') {
            return cstore.exportAsRowArray();
        } else {
            return cstore.exportAsJSON();
        }
    }

    cstore.import = function({
        data,
        schema = null
    }) {
        size = data.length;
        if(typeof(schema == 'object')) initStruct(schema);
        initCStore();
        cstore.addObjects(data);
        return cstore;
    }

    cstore.scale = function(attr, factor) {
        let len = columns[attr].length;
        for(var i = 0; i < len; i++) {
            columns[attr] *= factor;
        }
        return cstore;
    }

    cstore.normalize = function(attr) {
        if(!colStats.hasOwnProperty(attr)) {
            cstore.stats();
        }
        let fid = attributes.indexOf(attr);
        let len = columns[attr].length;
        let max = colStats[f].max;
        let min = colStats[f].min;

        if(types[fid] === 'float') {
            for(var i = 0; i < len; i++) {
                columns[attr][i] = (columns[attr][i] - min) / (max - min);
            }
        } 
        return cstore;
    }

    cstore.intervalize = function(attr, interval) {
        intervals[attr] = interval;
        if(!colStats.hasOwnProperty(attr)) {
            cstore.stats([attr]);
        }
        let fid = attributes.indexOf(attr);
        let len = columns[attr].length;
        let min = colStats[f].min;

        if(types[fid] === 'int' || types[fid] === 'float') {
            for(var i = 0; i < len; i++) {
                columns[attr][i] = (columns[attr][i] - min) / interval;
            }
        } 
        return cstore;
    }

    cstore.index = function(attr) {
        let attrId = attributes.indexOf(attr);
        if(attrId === -1) throw Error('Invalid attribute for indexing');
        types[attrId] = 'int';
        indexes[attr] = unique(columns[attr]).sort(function(a, b) {
            return a - b;
        });
        let len = columns[attr].length;
        for(var i = 0; i < len; i++) {
            columns[attr][i] = indexes[attr].indexOf(columns[attr][i]); 
        }
        
        return cstore;
    }

    return initCStore();
}
