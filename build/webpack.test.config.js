const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        "p4-test": "./test/main.js"
    },
    devtool: "source-map",
    target: 'web',
    resolve: {
        modules: [path.resolve(__dirname, '../..'), '../node_modules'],
        alias: {
            'p.3$': 'p3'
        }
    },
    output: {
        path: path.resolve(__dirname, "../test"),
        filename: "[name].js"
    },
    module: {
        exprContextCritical: false,
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader',]
          }
        ]
    },
    devServer: {
        compress: true,
        publicPath: '/test/',
        clientLogLevel: "none",
        historyApiFallback: true,
    },
    node: {
        fs: "empty"
    }
};