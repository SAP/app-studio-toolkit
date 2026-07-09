//@ts-check
"use strict";

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

/** @type {import('webpack').Configuration} */
module.exports = {
  target: "node",
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    libraryTarget: "commonjs2",
  },
  optimization: {
    // yeoman-environment v3's `isNamespace()` does `constructor.name === "YeomanNamespace"`.
    // Terser's default mangler renames the class to a short symbol at production
    // level, making that runtime string comparison always fail — every namespace
    // instance is then treated as a plain object, re-parsed, and rejected because
    // `typeof yeomanNamespaceInstance !== "string"`. Preserve class + function
    // names to keep those reflection-style checks working.
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
          mangle: {
            keep_classnames: true,
            keep_fnames: true,
          },
        },
      }),
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  module: {
    rules: [
      // TypeScript entry point — transpile with ts-loader against the local
      // tsconfig.json (commonjs target, matching the bundle output shape).
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
      // Webpack can't parse .cs files pulled in by node-gyp's dynamic requires —
      // return an empty module for them.
      {
        test: /\.cs$/,
        use: "null-loader",
      },
      // resolver.js reads PROJECT_ROOT/package.json at module load time to get the
      // package name pattern. When bundled, __dirname points at dist/ instead of
      // the v3 source root, so keep that particular require native at runtime.
      {
        test: /yeoman-environment[/\\]lib[/\\]resolver\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(path\\.join\\(PROJECT_ROOT,",
          replace: "__non_webpack_require__(path.join(PROJECT_ROOT,",
          flags: "g",
        },
      },
      // resolver.js uses require.resolve() to locate installed generator packages
      // from the machine, not the bundle — must stay native.
      {
        test: /yeoman-environment[/\\]lib[/\\]resolver\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\.resolve\\(",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      // esm.js loads generator files from disk by variable path — both require()
      // calls in the file are dynamic and must be native.
      {
        test: /yeoman-environment[/\\]lib[/\\]util[/\\]esm\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(fileToImport\\)",
          replace: "__non_webpack_require__(fileToImport)",
          flags: "g",
        },
      },
      // environment.js loads a package.json from an installed generator at runtime.
      {
        test: /yeoman-environment[/\\]lib[/\\]environment\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(`\\$\\{packageName\\}",
          replace: "__non_webpack_require__(`${packageName}",
          flags: "g",
        },
      },
      // environment.js uses require.resolve() to locate modules at runtime.
      {
        test: /yeoman-environment[/\\]lib[/\\]environment\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\.resolve\\(",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      // repository.js loads a package.json path that was resolved from disk.
      {
        test: /yeoman-environment[/\\]lib[/\\]util[/\\]repository\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(packageJson\\)",
          replace: "__non_webpack_require__(packageJson)",
          flags: "g",
        },
      },
    ],
  },
};
