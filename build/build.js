'use strict'
process.env.NODE_ENV = 'production'
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const webpackDevConfig = require('./webpack.config')
// const webpackTestConfig = require('./webpack.test.config')
const npmPackage = require(path.resolve(__dirname, '../package.json'));


let webpackConfig = webpackDevConfig;

if(process.argv[2] == 'test') webpackTestConfig;

webpack(webpackConfig, (err, stats) => {
  if (err) throw err
  
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n\n')

  if (stats.hasErrors()) {
    console.log(chalk.red('  Build failed with errors.\n'))
    process.exit(1)
  }

  console.log(chalk.cyan('  Build complete.\n'))

  let dir = path.resolve(__dirname, "../dist")
  let version = npmPackage.version
  fs.copyFile(path.join(dir, 'p4.js'), path.join(dir, 'p4.v' + version + '.js'), (err) => {
    if (err) throw err;
    console.log('dist file: ', 'p4.v' + version + '.js');
  })
})