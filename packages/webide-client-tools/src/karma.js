"use strict"

const optionalRequire = require("optional-require")(require)
const _ = require("lodash")
const middleware = require("./middleware")

/** @type {webideClientTools.KarmaAPI} */
const karma = {
  defaultProps: function defaultProps() {
    return {
      // base path that will be used to resolve all patterns (eg. files, exclude)
      basePath: "",

      files: [
        "node_modules/webide/src/main/webapp/resources/sap/watt/lib/q/q.js",
        // including require.js and it's adapter manually to allow loading UMD artifacts as globals
        // by prefixing entries before this list
        "node_modules/requirejs/require.js",
        "node_modules/karma-requirejs/lib/adapter.js",
        "node_modules/@sap-webide/webide-client-tools/resources/tests/testSetupUtils.js",
        {
          pattern: "node_modules/webide/src/main/webapp/*",
          served: true,
          included: false,
        },
        {
          pattern: "node_modules/webide/src/main/webapp/resources/**/*",
          served: true,
          included: false,
        },
        {
          pattern:
            "node_modules/@sap-webide/webide-client-tools/resources/tests/*.js",
          served: true,
          included: false,
        },
        {
          pattern:
            "node_modules/webide/src/main/webapp/test-resources/sap/watt/sane-tests/ui5Version.js",
          served: true,
          included: false,
        },
        // This webide folder contains many fake plugin implementations..
        {
          pattern:
            "node_modules/webide/src/main/webapp/test-resources/sap/watt/util/**/*",
          served: true,
          included: false,
        },
        {
          pattern:
            "node_modules/@sap-webide/webide-client-tools/resources/local_env/**/*",
          served: true,
          included: false,
        },
        // must serve the package.json because the core forces us to read it's name
        // as they do not allow bypassing that validation
        { pattern: "./package.json", served: true, included: false },
        "node_modules/@sap-webide/webide-client-tools/resources/tests/included/test-main.js",
      ],
      // frameworks to use
      // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
      // 'openui5'
      frameworks: ["openui5", "mocha"],

      openui5: {
        path: karma.getUi5VersionUrl(undefined, undefined),
        useMockServer: false,
      },

      // test results reporter to use
      // possible values: 'dots', 'progress'
      // available reporters: https://npmjs.org/browse/keyword/karma-reporter
      reporters: ["progress", "coverage"],

      coverageReporter: {
        includeAllSources: true,
      },

      client: {
        mocha: {
          reporter: "html",
        },
      },
      // web server port
      port: 9877,

      // enable / disable colors in the output (reporters and logs)
      colors: true,

      // enable / disable watching file and executing tests whenever any file changes
      autoWatch: false,

      // start these browsers
      // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
      browsers: ["Chrome"],

      // important to avoid tests disconnecting when waiting
      // for slow async calls, no timeout in the tests may exceed this!
      browserNoActivityTimeout: 60000,

      // Continuous Integration mode
      // if true, Karma captures browsers, runs the tests and exits
      singleRun: false,

      // see middleware section in:
      // https://karma-runner.github.io/1.0/config/configuration-file.html
      plugins: [
        "karma-*",
        {
          "middleware:di": [
            "factory",
            /* istanbul ignore next - Tested as part of integration tests */
            function () {
              return middleware.getDiProxyMiddleware({
                context: "/di",
              })
            },
          ],
        },
        {
          "middleware:minikube": [
            "factory",
            /* istanbul ignore next - Tested as part of integration tests */
            function () {
              const minikube = middleware.getMinikubeMiddleware({
                context: "/che6",
              })
              // Minikube not always available or online
              if (minikube) {
                return minikube
              }
              return function (req, res, next) {
                // noop
                next()
              }
            },
          ],
        },
      ],
      middleware: ["di", "minikube"],
    }
  },

  getUi5VersionUrl: function getUi5VersionUrl(version, baseUrl) {
    const defaultUi5Version = {
      version: "",
      baseURL: "https://sapui5.hana.ondemand.com/",
    }
    const webideUi5VersionPath =
      "webide/src/main/webapp/test-resources/sap/watt/sane-tests/ui5Version"

    const webIdeVersionObj = optionalRequire(
      webideUi5VersionPath,
      `Could not trace an UI5 version under ${webideUi5VersionPath}`
    )

    // user provided arguments first, then WebIDE's and only then the default fallback one.
    const actualObj = _.defaults(
      { version, baseUrl },
      webIdeVersionObj,
      defaultUi5Version
    )

    console.log(
      `Using UI5 ${
        actualObj.version === "" ? "latest" : actualObj.version
      } version from ${actualObj.baseURL}`
    )

    return `${actualObj.baseURL + actualObj.version}/resources/sap-ui-core.js`
  },
}

module.exports = karma
