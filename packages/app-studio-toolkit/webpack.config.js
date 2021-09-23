const path = require("path");
const baseConfig = require("../../webpack.config.vscode.base");

const config = Object.assign(baseConfig, {
  entry: "./dist/src/extension.js",
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  module: {
    rules: [
      {
        test: /.*.js$/,
        loader: "string-replace-loader",
        options: {
          // When bundling the `optional-require` flow must not be modified by webpack.
          search: 'require("optional-require")(require)',
          replace:
            "__non_webpack_require__('optional-require')(__non_webpack_require__)",
        },
      },
    ],
  },
  // 📖 -> https://webpack.js.org/configuration/externals/
  externals: {
    // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed.
    vscode: "commonjs vscode",
    // @sap/artifact-management uses relative (`__dirname`) logic to dynamically load its plugins
    "@sap/artifact-management": "commonjs @sap/artifact-management",
  },
});

module.exports = config;
