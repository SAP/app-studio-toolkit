const path = require("path");
const baseConfig = require("../../webpack.config.vscode.base");

const config = Object.assign({}, baseConfig, {
  entry: "./dist/src/extension.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  // 📖 -> https://webpack.js.org/configuration/externals/
  externals: {
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed.
    vscode: "commonjs vscode",
  },
  plugins: [],
});

module.exports = config;
