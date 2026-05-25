---
sidebar: auto
---

# FAQ

- [Requirejs Bundling: How to ignore AMD resources which should only be resolved at runtime?](#RUNTIME_RESOURCES)
- [Requirejs Bundling: How to ignore None AMD(require.js) resources?](#IGNORE_JS)
- [Requirejs Bundling: How to handle failures due to automatic detection of None AMD(require.js) resources?](#VALIDATE_AMD)

## Requirejs Bundling: How to ignore resources which should only be resolved at runtime?

RequireJS optimizer supports resolving certain resources at runtime only.
This can cause error message similar to:

> ENOENT: no such file or directory, open '...
> sap.watt.platform.commandgroup/module/MenuItem.js'
> In module tree:

    ......./DynamicItemProvider
    at Object.fs.openSync (fs.js:583:18)

Resolving only at runtime can be accomplished using the **empty:** directive in the **paths** configuration.

- [Official Require.js Docs](http://requirejs.org/docs/optimization.html#empty).
- Usage Example in W5G WebIDE Feature.

  ```javascript
  const requireJsOptions = {
    paths: {
      "sap.watt.saptoolsets.ui5.common.docuutils": "empty:",
    },
  }

  const bundling = require("webide-client-tools").bundling
  bundling.bundleFeature("src/package-fiori.json", {
    outDir: "dist/fiori/client",
    javaScriptOpts: {
      optimizeOptions: requireJsOptions,
    },
  })
  ```

## Requirejs Bundling: How to ignore None AMD resources?

The bundling logic simply activates the require.js optimizer on all the \*.js resources of the feature,
this is unfortunately not suitable for bundling none AMD resources such as:

- plain JS files.
- UI5 JS files.
- Common JS Files.

It is possible to ignore certain file patterns:

- [JS Docs](http://sap.github.io/webide-client-tools/web/html_docs/interfaces/_api_d_.bundlingapi.html) -
  see **javaScriptOpts.ignore** argument of bundleFeature

- For example:

  ```javascript
  bundling.bundleFeature("path_to_package.json", {
    javaScriptOpts: {
      ignore: ["**/myPlugin/resources/**.js", "client/plugin/gruntfile.js"],
    },
  })
  ```

- Note that the patterns used are [glob patterns](https://github.com/isaacs/node-glob#glob-primer)

## Require.js Bundling: How to handle failures due to automatic detection of None AMD(require.js) resources?

After the creation of the JS bundled artifacts the webide-client-tools will attempt to verify
that the artifact **only** contains AMD style entries.

This means that the artifact conforms to the following pattern:

```javascript
define("sap.webide.example.plugin/command/HelloWorld", {
  // code may only appear inside require.js define calls...
})

// more define calls...

define("sap.webide.example.plugin/service/helloUtils", {
  // ...
})
```

If an error message about None-AMD source code is raised then one should first check to see if those sources
are indeed valid error messages, for example:

```javascript
// good
define("sap.webide.example.plugin/command/HelloWorld", {
  // code may only appear inside require.js define calls...
  // Will be LAZY executed, when required as a dependency.
})

// Very bad! will be executed during initial artifact loading and could cause unexpected side effects.
jquery.sap.declare({
  /* ... */
})
```

This visual inspection may prove difficult as the artifact is normally minimifed using ugilfy2.
It is possible to create an unminified artifact for easier debugging by modifying the requirjs
[**optimizeOptions**](https://github.com/requirejs/r.js/blob/master/build/example.build.js) passed to the bundleFeature call..

```javascript
bundling.bundleFeature("path_to_package.json", {
  javaScriptOpts: {
    optimizeOptions: {
      optimize: "none",
    },
  },
})
```

If the detected sources should not have been bundled then exclude them using the
[**ignore**](#IGNORE_JS) option.

Alternatively if the detected sources are valid inclusions (UMD bundles / 3rd party bundled code)
which should be executed on bundle loading then it is possible to ignore this validation
using the **ignoreValidations** option.

```javascript
bundling.bundleFeature("path_to_package.json", {
  javaScriptOpts: {
    ignoreValidations: true,
  },
})
```

Note that if the validations have been ignored the feature developers take over the responsibility of avoiding
unintended side effects when loading their bundle. Such side effects could at worst break unrelated feature in the webide
or the webide itself.
