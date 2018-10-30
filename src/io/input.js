import * as ajax from './ajax';
import cstore from '../cstore';
import parse from './parse';

const INPUT_TYPES = [
    'json',
    'csv',
    'text',
    'RowArrays',
    'ColArrays',
    'cstore',
];

const INPUT_METHODS = ['memory', 'http', 'WebSocket', 'file'];

export default function input({
    type = 'cstore',
    method = 'memory',
    delimiter = ',',
    size,
    schema,
    source,
    uniqueKeys = []
}) {
    if(INPUT_TYPES.indexOf(type) === -1) {
        throw Error('Invalid input type ', type)
    }

    if(INPUT_METHODS.indexOf(method) === -1) {
        throw Error('Unknown method ', method)
    }

    let cache = cstore({
        schema: schema,
        size: size,
    })

    function createIndexes() {
        uniqueKeys.forEach(function(uk){
            cache.index(uk);
        })
    }

    let dataHandler = {
        json: function(data) {
            cache.import(data);
            createIndexes();
            return cache.data();
        },
        csv: function(text) {
            let data = parse(text, delimiter);
            data.shift();
            cache.addRows(data);
            createIndexes();
            return cache.data();
        }, 
        cstore: function() {
            if(Number.isInteger(source.size) && Array.isArray(source.types)) {
                return source;
            }
        }
    }

    dataHandler.text = dataHandler.csv;

    let response = function(data) {
       
        return new Promise(function(resolve, reject) {
            if(typeof(dataHandler[type]) === 'function') {
                resolve(dataHandler[type](data));
            } else {
                reject(Error('No handler for data type ', type));
            }
            
        })
    }

    if(method === 'http') {
        return ajax.get({url: source, dataType: type})
            .then(response)
    } else {
        return response(source);
    }
}
