const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const package = require(path.resolve(__dirname, '../package.json'));

module.exports = {
    entry: {
        "p4": "./index.js"
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
        path: path.resolve(__dirname, "../dist"),
        filename: "[name].v" + package.version + ".js"
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
        publicPath: '/dist/',
        clientLogLevel: "none",
        historyApiFallback: true,
    },
    node: {
        fs: "empty"
    }
    // plugins: [
    //     new UglifyJsPlugin({
    //         include: /\.min\.js$/,
    //         sourceMap: true
    //     })
    // ]
};