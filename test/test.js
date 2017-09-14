if(typeof define !== 'function' && typeof global === 'object')
    require('amdefine/intercept');

const genData = require('./generate-data');

var data = genData({
    size: 10000,
    props: [
        {name: 'height', dtype: 'float', min: 100, max: 230},
        {name: 'weight', dtype: 'float', min: 70, max: 300},
        {name: 'age', dtype: 'int', min: 16, max: 99}
    ]
})
