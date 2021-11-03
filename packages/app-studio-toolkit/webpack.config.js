const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const baseConfig = require("../../webpack.config.vscode.base");

const config = Object.assign({}, baseConfig, {
  entry: "./dist/src/extension.js",
  output: {
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
    // To enable bundling for @sap/artifact-management
    // fsevents is a macos file system event library that is compiled during installation.
    fsevents: "commonjs fsevents",
  },
  plugins: [
    // This is a workaround suggested by the artifact-management team to enable resolution
    // of the templates from the bundled artifact's folder.
    new CopyPlugin({
      patterns: [
        {
          from: "*.yaml",
          context: path.resolve(
            __dirname,
            "node_modules/@sap/artifact-management/dist/src/plugins/cap/generators/templates"
          ),
          to: "templates",
        },
        {
          from: "node_modules/@sap/artifact-management/dist/src/cp/templates",
          to: "templates",
        },
      ],
      options: {
        concurrency: 10,
      },
    }),
  ],
  node: {
    // needed to bundle artifact-management successfully
    __dirname: false,
  },
});

module.exports = config;
