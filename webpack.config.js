const path = require('path');

module.exports = {
  entry: './build.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'p4.test.js'
  }
};
