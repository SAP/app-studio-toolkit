// Needs to run in browser, but the eslint config here is for node.js (ES6).
/* eslint-disable */
"use strict"
;(function () {
  if (!window.TEST_FILE_PATTERN) {
    throw new Error("Missing <window.TEST_FILE_PATTERN> RegExp property")
  }

  var actualTestsFilesPattern = window.TEST_FILE_PATTERN
    ? window.TEST_FILE_PATTERN
    : DEFAULT_TESTS_FILE_PATTERN

  console.log(
    "Test Config --> TEST_FILE_PATTERN: <" +
      actualTestsFilesPattern.source +
      ">"
  )

  var DEFAULT_TESTS_TIMEOUT = 30000
  var actualTestTimeout = window.CUSTOM_TESTS_TIMEOUT
    ? window.CUSTOM_TESTS_TIMEOUT
    : DEFAULT_TESTS_TIMEOUT
  console.log(
    "Test Config --> CUSTOM_TESTS_TIMEOUT: <" + actualTestTimeout + ">"
  )

  var DEFAULT_REQUIREJS_WAIT_SECONDS = 20
  var actualRequireJSWaitSeconds = window.CUSTOM_REQUIREJS_WAIT_SECONDS
    ? window.CUSTOM_REQUIREJS_WAIT_SECONDS
    : DEFAULT_REQUIREJS_WAIT_SECONDS

  console.log(
    "Test Config --> CUSTOM_REQUIREJS_WAIT_SECONDS: <" +
      actualRequireJSWaitSeconds +
      ">"
  )

  var tests = []
  for (var file in window.__karma__.files) {
    if (actualTestsFilesPattern.test(file)) {
      tests.push(file)
    }
  }

  mocha.setup({
    timeout: actualTestTimeout,
  })

  var paths = merge_objects(
    {
      sap: "node_modules/webide/src/main/webapp/resources/sap",
      ui5: "node_modules/webide/src/main/webapp/resources/sap/watt/ui5/UI5RequirejsPlugin",
      ui5Version:
        "node_modules/webide/src/main/webapp/test-resources/sap/watt/sane-tests/ui5Version",
      STF: "node_modules/@sap-webide/webide-client-tools/resources/tests/serviceTestFramework",
      coverage:
        "node_modules/@sap-webide/webide-client-tools/resources/tests/coverage",
      mockConf:
        "node_modules/webide/src/main/webapp/test-resources/sap/watt/util/mock_conf",
    },
    window.CUSTOM_REQUIREJS_PATHS
  )

  require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: "/base",

    paths: paths,

    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start,

    waitSeconds: actualRequireJSWaitSeconds,
  })
})()
