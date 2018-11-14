'use strict'
process.env.NODE_ENV = 'production'

const path = require('path')
const chalk = require('chalk')
const webpack = require('webpack')
const webpackDevConfig = require('./webpack.dev.config')
// const webpackTestConfig = require('./webpack.test.config')

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
})