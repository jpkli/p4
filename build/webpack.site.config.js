const path = require('path');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  entry: {
    "site": "./site/main.js"
  },
  mode: 'development',
  target: 'web',
  resolve: {
    modules: [path.resolve(__dirname, '../..'), '../node_modules'],
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
        loader: 'js-yaml-loader'
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
      }
    ]
  },
  node: {
    fs: "empty"
  }
};