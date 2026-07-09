//@ts-check

"use strict";

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  node: { global: true },
  entry: ["./src/extension.ts"], // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  devtool: "source-map",
  experiments: {
    outputModule: true,
  },
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    library: {
      type: "module",
    },
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  externalsType: "module",
  externals: {
    // vscode is provided by the extension host, not bundled.
    vscode: "module vscode",
    // spdx-expression-parse (pulled in transitively by @npmcli/arborist → fly-import
    // → yeoman-environment v6) `require`s these siblings, but they are not listed
    // in its `dependencies` — pnpm's strict layout therefore does not place them
    // where webpack's `resolve.modules: ["node_modules"]` walk can reach them.
    // Leave them as unresolved externals; the code path that actually loads them
    // is only reached when Arborist normalizes a package.json license field,
    // which happens during `npm install`-style flows the extension never runs.
    "spdx-license-ids": "commonjs2 spdx-license-ids",
    "spdx-license-ids/deprecated": "commonjs2 spdx-license-ids/deprecated",
    "spdx-exceptions": "commonjs2 spdx-exceptions",
    // Optional native metric packages that Application Insights tries to load
    // via `require()` but that are absent in production installs — leave them
    // as un-resolvable externals so webpack does not attempt to bundle them.
    "@azure/functions-core": "commonjs2 @azure/functions-core",
    "applicationinsights-native-metrics":
      "commonjs2 applicationinsights-native-metrics",
  },
  resolve: {
    modules: ["node_modules"],
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
    // node16 module resolution requires explicit `.js` extensions in ESM
    // relative imports; those specifiers must map back to their `.ts` sources
    // during bundling.
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
  module: {
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
      // yeoman-environment v6 store.js: `require(meta.resolved)` loads a
      // generator module from disk at runtime. Webpack's static analyzer
      // would try to resolve it through the bundle graph — force it native.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require\\(meta\\.resolved\\)",
          replace: "__non_webpack_require__(meta.resolved)",
          flags: "g",
        },
      },
      // ...and the parallel require.resolve() call.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require\\.resolve\\(meta\\.resolved\\)",
          replace: "__non_webpack_require__.resolve(meta.resolved)",
          flags: "g",
        },
      },
      // store.js falls back to dynamic import() for ESM generators. Webpack
      // would turn this into its own chunk loader, breaking runtime loading of
      // generators from disk. Wrap in Function() to hide it from webpack.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]store\.js/,
        loader: "string-replace-loader",
        options: {
          search: "return import\\(",
          replace:
            "return new Function('specifier', 'return import(specifier)')(",
          flags: "g",
        },
      },
      // environment-full.js: `await import('yeoman-generator')` is a static
      // string, so webpack CAN resolve and bundle yeoman-generator — but doing
      // so triples the bundle size and yeoman-generator itself does dynamic
      // filesystem loading. Keep it as a native runtime import so the
      // generator's own installed copy on disk is used.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]environment-full\.js/,
        loader: "string-replace-loader",
        options: {
          search: "await import\\('yeoman-generator'\\)",
          replace:
            "await new Function('s', 'return import(s)')('yeoman-generator')",
          flags: "g",
        },
      },
      // fly-import (yeoman-environment's fallback generator loader) does a
      // native dynamic import that must not be bundled.
      {
        test: /fly-import[/|\\]dist[/|\\]fly-import\.js/,
        loader: "string-replace-loader",
        options: {
          search: "async \\(\\) => import\\(",
          replace: "async () => new Function('s', 'return import(s)')(",
          flags: "g",
        },
      },
      // yeoman-generator v8 lifecycle.js also loads sub-generators from disk.
      {
        test: /yeoman-generator[/|\\]dist[/|\\]actions[/|\\]lifecycle\.js/,
        loader: "string-replace-loader",
        options: {
          search: "await import\\(",
          replace: "await new Function('s', 'return import(s)')(",
          flags: "g",
        },
      },
      // yeoman-environment v6 module-lookup.js runs at module load time:
      //   const __filename    = fileURLToPath(import.meta.url);
      //   const __dirname     = dirname(__filename);
      //   const PROJECT_ROOT  = join(__dirname, '..');
      //   const PACKAGE_NAME_PATTERN =
      //     [JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json')).toString()).name];
      //
      // When webpack inlines this module into a code-split chunk, `import.meta.url`
      // in the inlined body is baked to the build-machine file:// URL, so at runtime
      // on another machine (BAS, CI, …) readFileSync throws ENOENT for the frozen
      // absolute path. Also, the un-referenced `fileURLToPath(import.meta.url)` call
      // survives dead-code elimination and leaks the build-machine path as a string
      // literal into the shipped bundle. Neutralize all four preamble constants so
      // no filesystem I/O runs at load time and no build-machine path is retained.
      {
        test: /yeoman-environment[/|\\]dist[/|\\]module-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          search:
            "const __filename = fileURLToPath\\(import\\.meta\\.url\\);",
          replace:
            "const __filename = ''; // neutralized by webpack.config.cjs — bake-machine import.meta.url is not portable",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]dist[/|\\]module-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          search: "const __dirname = dirname\\(__filename\\);",
          replace:
            "const __dirname = ''; // neutralized by webpack.config.cjs",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]dist[/|\\]module-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          search:
            "const PROJECT_ROOT = join\\(__dirname, '\\.\\.'\\);",
          replace:
            "const PROJECT_ROOT = ''; // neutralized by webpack.config.cjs",
          flags: "g",
        },
      },
      {
        test: /yeoman-environment[/|\\]dist[/|\\]module-lookup\.js/,
        loader: "string-replace-loader",
        options: {
          // PACKAGE_NAME_PATTERN is only referenced further down in this same
          // file as the DEFAULT for `options.packagePatterns`. Yeoman-ui always
          // passes an explicit `packagePatterns` (or the caller in v6's own
          // `generator-lookup.js` does — set to `['generator-*']`), so the
          // inlined value is never actually consulted at lookup time. The
          // literal `'yeoman-environment'` is just a non-empty placeholder that
          // makes the static array shape well-formed.
          search:
            "const PACKAGE_NAME_PATTERN = \\[JSON\\.parse\\(readFileSync\\(join\\(PROJECT_ROOT, 'package\\.json'\\)\\)\\.toString\\(\\)\\)\\.name\\];",
          replace:
            "const PACKAGE_NAME_PATTERN = ['yeoman-environment']; // inlined by webpack.config.cjs — see this file's rule comment above",
          flags: "g",
        },
      },
      // colors loads themes via a dynamic require(theme) call.
      {
        test: /node_modules[/|\\]colors[/|\\]lib[/|\\]colors.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]theme",
          replace: "__non_webpack_require__(theme",
          flags: "g",
        },
      },
      // node-gyp is pulled in transitively by @npmcli/arborist. The code path
      // that reaches it (native-module rebuild during install) is never hit
      // from the extension, but webpack still has to parse its source graph:
      //   - Find-VisualStudio.cs is a C# file webpack cannot parse — return
      //     an empty module for it.
      //   - bin/node-gyp.js starts with a `#!/usr/bin/env node` shebang that
      //     webpack's static analyzer trips on — comment it out.
      //   - lib/node-gyp.js does `require('./' + command)` dynamically —
      //     hide it from webpack via __non_webpack_require__.
      {
        test: /Find-VisualStudio\.cs$/,
        use: "null-loader",
      },
      {
        test: /node-gyp[/|\\]lib[/|\\]node-gyp.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'[.]",
          replace: "__non_webpack_require__('.",
          flags: "g",
        },
      },
      {
        test: /node-gyp[/|\\]bin[/|\\]node-gyp.js/,
        loader: "string-replace-loader",
        options: {
          search: "[#][!]",
          replace: "//#!",
          flags: "g",
        },
      },
      {
        test: /promise-inflight[/|\\]inflight.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]download-stats[/|\\]lib[/|\\]utils.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]",
          replace: "__non_webpack_require__(",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]download-stats[/|\\]lib[/|\\]utils.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[)]",
          replace: "__non_webpack_require__)",
          flags: "g",
        },
      },
      // ejs's `require.extensions` is legacy Node API webpack cannot polyfill.
      {
        test: /node_modules[/|\\]ejs[/|\\]lib[/|\\]ejs.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]extensions",
          replace: "__non_webpack_require__.extensions",
          flags: "g",
        },
      },
      // env.ts uses `_require.cache` (a runtime `createRequire` result) to
      // unload generator modules between runs. Under ESM output that
      // `createRequire` runs natively at runtime and its `.cache` is a live
      // property — no webpack rewrite needed. Rule kept out intentionally.
      // vscodeProxy.ts inspects require.main to detect the extension host.
      {
        test: /utils[/|\\]vscodeProxy.ts/,
        loader: "string-replace-loader",
        options: {
          search: "require[.]main",
          replace: "__non_webpack_require__.main",
          flags: "g",
        },
      },
      // ws's optional native accelerators — kept optional at runtime.
      {
        test: /node_modules[/|\\]ws[/|\\]lib[/|\\]buffer-util.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'bufferutil",
          replace: "__non_webpack_require__('bufferutil",
          flags: "g",
        },
      },
      {
        test: /node_modules[/|\\]ws[/|\\]lib[/|\\]validation.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]'utf-8-validate",
          replace: "__non_webpack_require__('utf-8-validate",
          flags: "g",
        },
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // ecma 2020 required to parse modern class syntax from deep dependencies
          // keep_classnames/keep_fnames prevent mangling that breaks dynamic ESM imports
          ecma: 2020,
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
};
module.exports = config;
