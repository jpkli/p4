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

const INPUT_METHODS = ['memory', 'http', 'websocket', 'file'];

export default function input({
    type = 'cstore',
    method = 'memory',
    delimiter = ',',
    size,
    schema,
    source,
    onready,
    uniqueKeys = []
}) {
    if(INPUT_TYPES.indexOf(type) === -1) {
        throw Error('Invalid input type ', type)
    }

    if(INPUT_METHODS.indexOf(method) === -1) {
        throw Error('Unknown method ', method)
    }

    let cache

    function createIndexes() {
        uniqueKeys.forEach(function(uk){
            cache.index(uk);
        })
    }

    let dataHandlers = {
        json: function(data) {
            cache = cstore({schema, size})
            cache.import((method == 'websocket') ? JSON.parse(data) : data);
            createIndexes();
            return cache.data();
        },
        csv: function(text) {
            let data = parse(text, delimiter);
            let fields = data.shift();
            cache = cstore({keys: fields, types: fields.map(() => 'float')})
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

    dataHandlers.text = dataHandlers.csv;

    let response = function(data) {
        return new Promise(function(resolve, reject) {
            if(typeof(dataHandlers[type]) === 'function') {
                resolve(dataHandlers[type](data));
            } else {
                reject(Error('No handler for data type ', type));
            }
        })
    }

    if(method === 'http') {
        return ajax.get({url: source, dataType: type}).then(response);
    } else if (method == 'websocket') {
        return new Promise(function(resolve, reject) {
            var socket = new WebSocket(source);
            socket.onopen = function() {
                if(typeof(onready) === 'function') onready(socket)
            }
            socket.onmessage = function(event) {
                resolve(dataHandlers[type](event.data));
            }
            socket.onerror = function(err) {
                reject(err);
            }
        });
    } else {
        return response(source);
    }
}
