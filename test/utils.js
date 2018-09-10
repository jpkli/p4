
import {assert} from 'chai';
import {normal} from 'jStat';
import cstore from '../src/cstore'

let equal = assert.equal;
let closeTo = assert.closeTo;
let hasAllKeys = assert.hasAllKeys;
let normalDist = normal.sample;

export function boundedRandom(p) {
    let min = p.min || 0;
    let max = p.max || p.values.length || 1;
    let value = min - 1;
    let rand = (p.dist == 'normal') 
        ? function() { return normalDist(p.mean, p.std); }
        : function() { return min + (max - min) * Math.random(); }
    while ( value < min || value > max) {
        // value = normalDist(p.mean, p.std);
        value = rand(p);
    }
    if(p.hasOwnProperty('values')){
        value = parseInt(value) ;
    }
    return value;
}

export function randomColumns(arg) {
    let options = arg || {};
    let size = options.size || 0;
    let props = options.props || [];
    let db = cstore({});
    props.forEach(function(prop) {
        let dtype = p6.ctypes[prop.dtype] || Uint16Array;
        let tuples = new dtype(size);
        for(let i = 0; i < size; i++) {
            tuples[i] = boundedRandom(prop);
        }
        db.addColumn({
            data: tuples,
            name: prop.name,
            dtype: prop.dtype || 'string',
            values: prop.values
        });
    })
    return db;
}

export function randomJSONs(arg) {
    let options = arg || {};
    let size = options.size || 0;
    let props = options.props || [];
    let data = new Array(size);
    for(let i = 0; i < size; i++) {
        data[i] = {};
        props.forEach(function(prop) {
            if(prop.hasOwnProperty('values')){
                let vid = parseInt( Math.round( Math.random() * (prop.values.length - 1) ) );
                data[i][prop.name] = prop.values[vid];
            } else {
                let value = boundedRandom(prop);
                data[i][prop.name] = (prop.dtype == 'float') ? parseFloat(value) : Math.round(value);
            }
        });
    }
    return data;
}

export function validate(actual, expected, _delta) {
    let delta = _delta || 1e-5;
    let count = actual.length; 

    equal(count, actual.length, 'the size of the result should be ' + count);

    for(let i = 0; i < count; i++) {
        let keys = Object.keys(actual[i]);
        hasAllKeys(expected[i], keys, 'result should have all the keys');
        
        for(let j = 0, l = keys.length; j < l; j++) {
            if(typeof(actual[i][keys[j]]) == 'number') {
                closeTo(actual[i][keys[j]], expected[i][keys[j]], expected[i][keys[j]]*delta);
            } else {
                equal(actual[i][keys[j]], expected[i][keys[j]]);
            }
        }
    }

}