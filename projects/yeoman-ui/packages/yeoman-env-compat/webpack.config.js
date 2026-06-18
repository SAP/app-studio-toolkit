"use strict";

const path = require("path");
const fs = require("fs");

// Resolve the real paths to the v3/v4 packages via the symlinks pnpm created.
// This ensures webpack bundles yeoman-environment@3 and yeoman-generator@4,
// not whatever hoisted version it would find by walking up node_modules
const compatNodeModules = path.resolve(__dirname, "node_modules");
const envV3Root = fs.realpathSync(
  path.join(compatNodeModules, "yeoman-environment")
);
const genV4Root = fs.realpathSync(
  path.join(compatNodeModules, "yeoman-generator")
);

// istextorbinary and errlop use the 'editions' multi-edition loader which exposes ESM
// files that webpack cannot parse. Resolve them to their known CJS editions directly.
// Using require.resolve() anchored to the generator v4 package to stay within its dep tree
const genV4Req = require("module").createRequire(genV4Root + "/package.json");
const istextorbinaryCJS = genV4Req
  .resolve("istextorbinary")
  .replace(/index\.js$/, "edition-node-0.12/index.js");
const errlop = genV4Req.resolve("errlop");

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
    minimize: false, // keep class names intact; generators rely on them
  },
  externals: {
    // spdx-* are large data packages already present in the backend bundle
    "spdx-license-ids": "commonjs spdx-license-ids",
    "spdx-license-ids/deprecated": "commonjs spdx-license-ids/deprecated",
    "spdx-exceptions": "commonjs spdx-exceptions",
    // node-gyp does a dynamic require('./' + command) that pulls in a .cs file webpack
    // cannot parse. Externalize it — only used for native module compilation, never during
    // generator execution
    "node-gyp": "commonjs node-gyp",
    // bluebird is an optional peer of promise-inflight; not present in pnpm store
    bluebird: "commonjs bluebird",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    // Point webpack directly at the v3/v4 roots so it never accidentally picks up
    // a hoisted v6/v8 from higher up in the pnpm store
    alias: {
      "yeoman-environment": envV3Root,
      "yeoman-generator": genV4Root,
      // istextorbinary/errlop use the 'editions' multi-edition loader which exposes ESM
      // files that webpack can't parse. Alias them directly to their CJS editions
      istextorbinary: istextorbinaryCJS,
      errlop: errlop,
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [{ loader: "ts-loader" }],
      },
      // node-gyp does require('./' + command) which pulls in Find-VisualStudio.cs.
      // Webpack can't parse .cs files — return an empty module for them
      {
        test: /\.cs$/,
        use: "null-loader",
      },
      // resolver.js line 16: reads PROJECT_ROOT/package.json at module-load time to get
      // the package name pattern. When bundled, __dirname points to dist/ not the source
      // root, so the path.join(PROJECT_ROOT, 'package.json') call would resolve wrong.
      // Patch only this specific call — leave all other requires (arrify, slash, etc.) bundled
      {
        test: /yeoman-environment[/\\]lib[/\\]resolver\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(path\\.join\\(PROJECT_ROOT,",
          replace: "__non_webpack_require__(path.join(PROJECT_ROOT,",
          flags: "g",
        },
      },
      // resolver.js uses require.resolve() at runtime to locate installed generator packages
      {
        test: /yeoman-environment[/\\]lib[/\\]resolver\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\.resolve\\(",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      // esm.js loads generator files from disk at runtime by variable path — must stay native.
      // Both require() calls in this file are dynamic: require(fileToImport)
      {
        test: /yeoman-environment[/\\]lib[/\\]util[/\\]esm\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(fileToImport\\)",
          replace: "__non_webpack_require__(fileToImport)",
          flags: "g",
        },
      },
      // environment.js: require(`${packageName}/package.json`) is a runtime disk lookup
      {
        test: /yeoman-environment[/\\]lib[/\\]environment\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(`\\$\\{packageName\\}",
          replace: "__non_webpack_require__(`${packageName}",
          flags: "g",
        },
      },
      // environment.js: require.resolve(path / moduleId) for runtime module resolution
      {
        test: /yeoman-environment[/\\]lib[/\\]environment\.js$/,
        loader: "string-replace-loader",
        options: {
          search: "require\\.resolve\\(",
          replace: "__non_webpack_require__.resolve(",
          flags: "g",
        },
      },
      // repository.js: require(packageJson) loads a resolved package.json path from disk
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
