//@ts-check
"use strict";

const path = require("path");
const fs = require("fs");

// Resolve the real path to yeoman-environment@3 through the symlink pnpm created
// under this package's node_modules. Without realpathSync webpack might follow
// a hoisted copy higher up in the pnpm store and bundle a mismatched version.
const compatNodeModules = path.resolve(__dirname, "node_modules");
const envV3Root = fs.realpathSync(
  path.join(compatNodeModules, "yeoman-environment")
);

// istextorbinary and errlop ship multiple editions via the 'editions' loader,
// several of which are ESM files webpack can't parse. Alias each to its known
// CJS edition, resolved from v3's own dep tree.
const envV3Req = require("module").createRequire(envV3Root + "/package.json");
const istextorbinaryCJS = envV3Req
  .resolve("istextorbinary")
  .replace(/index\.js$/, "edition-node-0.12/index.js");
const errlop = envV3Req.resolve("errlop");

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
    // Keep class and function names — generators inspect env.runLoop and
    // rely on structural class identity that mangling would break.
    minimize: false,
  },
  externals: {
    // spdx-* are large data packages and already present in the backend bundle.
    "spdx-license-ids": "commonjs spdx-license-ids",
    "spdx-license-ids/deprecated": "commonjs spdx-license-ids/deprecated",
    "spdx-exceptions": "commonjs spdx-exceptions",
    // node-gyp does dynamic require('./' + command) and pulls in a .cs file
    // webpack can't parse. Only relevant during native module compilation,
    // never during generator execution — externalize it.
    "node-gyp": "commonjs node-gyp",
    // bluebird is an optional peer of promise-inflight; not present in pnpm store.
    bluebird: "commonjs bluebird",
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      "yeoman-environment": envV3Root,
      istextorbinary: istextorbinaryCJS,
      errlop: errlop,
    },
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
