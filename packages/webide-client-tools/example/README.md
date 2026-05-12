# Background

A template for an SAP Web IDE feature using the client-tools package.

This is used as live docs and also for integration tests.

# Demonstrated Flows

The demonstrated flows are based on npm scripts. For in-depth documentation about npm scripts, see [npm scripts](https://docs.npmjs.com/misc/scripts).

This file documents the following flows:

- [Initial Setup](#SETUP)
- [Customizing Flows](#CUSTOMIZE)
- [Development Server](#DEV_SERVER)
- [Bundling](#BUNDLING)
- [Testing](#TESTING)

## <a name="SETUP"></a> Initial Setup

In this directory:

- `npm update`

**NOTE**: The static resources of SAP Web IDE will be downloaded as well, because SAP Web IDE is listed as a _dev-dependency_ in the _package.json_ file.

## <a name="CUSTOMIZE"></a> Customizing Flows

Nearly all APIs provided by the client-tools library can be customized.

- The APIs provided by the client-tools library are programmatic and not limited to CLI/GUI.
- The [Configuration Object Pattern](https://stackoverflow.com/questions/7466817/javascript-configuration-pattern) is the de facto standard for providing APIs by the client-tools library.
  **NOTE**: Anything else is considered a **bug!**

For example, let's assume we want to bundle our feature. The example executes it by running:

`npm run bundle`

If we inspect the _package.json_ file of this example, we can see the npm _run_ command executes the _scripts/bundle.js_ file,
which in turns executes a programmatic API of the client-tools library.

```javascript
const bundling = require("webide-client-tools").bundling

bundling.bundleFeature()
```

This _bundleFeature_ command accepts an optional configuration argument, which is documented in the [JS Docs](https://sap.github.io/webide-client-tools/web/html_docs/interfaces/_api_d_.bundlingapi.html#bundlefeature) documentation.

## <a name="DEV_SERVER"></a> Development Server

A local development server provides a static web server for hosting and serving a feature's resources. This is used to run SAP Web IDE and its extensions locally for development purposes.

1.  First, let's start our static web server development server.

    `npm run dev_server`

2.  Now we can open SAP Web IDE locally by opening: [http://localhost:3000](http://localhost:3000) in our favorite browser.

**Note**: The example plugin has been loaded. We can run its service by choosing:
`Tools --> Samples --> Helloworld`

**Note**: The SAP Web IDE instance starts with a mock back end, so no back-end server is required.

### How Does the Development Server Work?

_localhost:3000_ redirects to _localhost:3000/index.html_.
This [index.html](https://github.com/SAP/webide-client-tools/blob/master/example/template/index.html) starts SAP Web IDE in an iframe and injects configuration options, such as adding our example plugin's _package.json_ file to the root SAP Web IDE _featureConfig_.

This is available as a programmatic API (**startWebIDE**) with several optional arguments.

Let's have a look at two variants to demonstrate customizability:
[index_dist.html](https://github.com/SAP/webide-client-tools/blob/master/example/template/index_dist.html). This starts SAP Web IDE and loads the example plugin from the _dist_ folder after bundling.

## <a name="BUNDLING"></a> Bundling

Bundling enables a feature to package its contents in fewer files, thus allowing faster loading in the end user's browser.
There are three types of artifacts:

- JavaScript resources:

  Bundled using the [require.js optimizer](http://requirejs.org/docs/optimization.html).

- SAP Web IDE metadata files (package.json/plugin.json/interface.json):

  Bundled using proprietary logic.

- i18n resources:

  Bundled using proprietary logic.

To examine the bundled artifacts:

1.  Execute bundling for this feature.

    `npm run bundle`

2.  Inspect the _dist_ folder of the _example/template_ directory where this _readme_ file resides.

**Note**: The majority of the bundled resources, and most complex, are the JavaScript resources (_.js_ files). The bundling API is just a wrapper for a standard tool (_require.js_ optimizer) in that case. This means that issues can normally be resolved by searching using Google.

Relevant Resources:

- http://requirejs.org/docs/node.html#optimizer
- http://requirejs.org/docs/api.html#config
- https://stackoverflow.com/questions/tagged/requirejs

**Note**: The _require.js_ optimizer is meant only to bundle files using the AMD module pattern. See the [FAQ](https://github.com/SAP/webide-client-tools/blob/master/FAQ.md) for details about how to exclude files from bundling.

## <a name="TESTING"></a> Testing

For more information about testing, see the [documentation](https://github.com/SAP/webide-client-tools/blob/master/docs/unit_service_testing.md).
