const path = require("path");
const baseConfig = require("../../webpack.config.vscode.base");

const config = Object.assign({}, baseConfig, {
  entry: "./out/src/extension.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  module: {
    // https://webpack.js.org/configuration/module/#modulenoparse
    // used to avoid transforming native require usage in `optional-require` implementation
    noParse: /native-require\.(js|ts)$/,
  },
  // 📖 -> https://webpack.js.org/configuration/externals/
  externals: {
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed.
    vscode: "commonjs vscode",
    // To enable bundling for @sap/artifact-management
    // fsevents is a macos file system event library that is compiled during installation.
    fsevents: "commonjs fsevents",
  },
  node: {
    // needed to bundle artifact-management successfully
    __dirname: false,
  },
});

module.exports = config;
