const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {
        "p4": "./index.js"
    },
    mode: 'production',
    target: 'web',
    resolve: {
        modules: [path.resolve(__dirname, '../..'), '../node_modules']
    },
    output: {
        path: path.resolve(__dirname, "../dist"),
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
        publicPath: '/dist/',
        clientLogLevel: "none",
        historyApiFallback: true,
    },
    node: {
        fs: "empty"
    },
    optimization: {
        minimize: false,
        // minimizer: [
        //     new UglifyJsPlugin({
        //         exclude: /\.glsl.js/,
        //     }),
        // ],
    }
};