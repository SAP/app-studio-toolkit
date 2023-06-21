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
    // https://webpack.js.org/configuration/module/#modulenoparse
    // used to avoid transforming native require usage in `optional-require` implementation
    noParse: /native-require\.(js|ts)$/,
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /node_modules[/|\\]fast-json-stringify[/|\\]index.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'long",
          replace: "__non_webpack_require__('long",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]express[/|\\]lib[/|\\]view.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]mod",
          replace: "__non_webpack_require__(mod",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]ssh-config[/|\\]index.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]mod",
          replace: "__non_webpack_require__(mod",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]@microsoft[/|\\]dev-tunnels-ssh[/|\\]algorithms[/|\\]node[/|\\]nodeRsa.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'node-rsa",
          replace: "__non_webpack_require__('node-rsa",
          flags: "g",
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
