const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
function resolve (dir) {
    return path.join(__dirname, '..', dir)
}  

module.exports = {
    entry: {
        "p4": "./index.js",
        "p4-test": "./test/main.js",
	      "site": "./site/main.js"
    },
    devtool: "source-map",
    target: 'web',
    resolve: {
        modules: ['../node_modules', path.resolve(__dirname, '../..')]
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
            use: ['style-loader', 'css-loader']
          },
          {
            test: /\.yaml$/,
            loader: 'js-yaml-loader',
            include: [resolve('site')]
          },
          {
            test: /\.(html)$/,
            loader: 'html-loader',
            include: [resolve('site')]
          },
          {
            test: /\.md$/i,
            use: 'raw-loader',
            include: [resolve('docs')]
          },
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
