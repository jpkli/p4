const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

var clientConfig = {
    entry: {
        "p6": "./index.js",
        // "p6.min": "./index.js"
    },
    devtool: "source-map",
    target: 'web',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    // plugins: [
    //     new UglifyJsPlugin({
    //         include: /\.min\.js$/,
    //         sourceMap: true
    //     })
    // ]
};

// var serverConfig = {
//     entry: {
//         "p6": "./index.js"
//     },
//     target: 'node',
//     output: {
//         path: path.resolve(__dirname, 'dist'),
//         filename: 'p6.node.js'
//     }
// };
// module.exports = [ serverConfig, clientConfig ];

module.exports = clientConfig;