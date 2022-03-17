const path = require("path")
const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const assets = ['lib']; // asset directories

rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { loader: 'postcss-loader' }
  ],
});

plugins.push(
  new webpack.DefinePlugin({
    'process.env': {},
  })
)

assets.forEach((asset) => plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, "src", asset),
        to: path.resolve(__dirname, ".webpack/renderer", asset),
      }
    ]
  })
))

module.exports = {
  module: {
    rules,
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      stream: require.resolve("stream-browserify"),
      assert: require.resolve("assert"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      url: require.resolve("url"),
    },
  },
};