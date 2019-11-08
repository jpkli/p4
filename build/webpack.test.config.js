const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
function resolve (dir) {
  return path.join(__dirname, '..', dir)
}  
module.exports = {
    entry: {
        "p4-test": "./test/main.js"
    },
    devtool: "source-map",
    target: 'web',
    resolve: {
      modules: [path.resolve(__dirname, '../..'), '../node_modules'],,
      alias: {p3$: 'p3.js'}
    },
    output: {
        path: path.resolve(__dirname, "../dist"),
        filename: "[name].js"
    },
    module: {
        exprContextCritical: false,
        rules: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [resolve('src'), resolve('dist')]
          },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
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
};