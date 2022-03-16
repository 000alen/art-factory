const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const webpack = require('webpack');

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

// plugins.push([
//   "@electron-forge/plugin-webpack",
//   {
//     "mainConfig": "./webpack.main.config.js",
//     "devContentSecurityPolicy": "connect-src 'self' * 'unsafe-eval'",
//     "renderer": {
//       "config": "./webpack.renderer.config.js",
//       "entryPoints": [
//         {
//           "html": "./src/index.html",
//           "js": "./src/renderer.ts",
//           "name": "main_window"
//         }
//       ]
//     }
//   }
// ])

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
