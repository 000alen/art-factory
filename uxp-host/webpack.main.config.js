const path = require("path")
const rules = require("./webpack.rules");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const plugins = []

plugins.push(
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, "node_modules/sharp/build/Release"),
        to: path.resolve(__dirname, ".webpack/main/native_modules/prebuilds/win32-x64"),
      }
    ]
  }))


module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  externals: {
    'sharp': 'commonjs sharp'
  },
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
};
