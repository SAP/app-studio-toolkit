"use strict"

const argv = require("minimist")(process.argv.slice(2))
// flag to indicate running the tests with code coverage on
const coverageMode = !!argv.coverage
// flag to indicate running the tests using the bundled artifacts.
const distMode = !!argv.dist
const withDi = !argv.with_di

if (coverageMode) {
  console.log("running karma in coverage mode")
}

if (distMode) {
  console.log("running karma in dist (bundled) mode")
}

if (withDi) {
  console.log("running karma in 'with_di' mode")
}

const karmaTools = require("@sap-webide/webide-client-tools").karma

module.exports = function (config) {
  const webideConfig = karmaTools.defaultProps()

  const userFiles =
    // extra files configuration see docs at:
    // http://karma-runner.github.io/1.0/config/files.html
    [
      // Chai is a very good assertion library (http://chaijs.com/)
      // It is not part of the webide-client-tools, you may use which ever assertion library you prefer...
      "node_modules/chai/chai.js",

      // The testSetup.js defines the pattern that identifies test files
      // and optionally other test configuration options such as timeouts / custom require.js paths
      "test/testsSetup.js",

      // The karma webserver must "serve" both our production and test sources to enable testing.
      // Add additional patterns here depending on your project's structure.
      {
        pattern: "src/**/*",
        served: true,
        included: false,
        // nocache prevents usage of coverage preprocessor
        nocache: !coverageMode,
      },
      {
        pattern: "test/**/*",
        served: true,
        included: false,
        nocache: true,
      },
      {
        pattern: "dist/**/*",
        served: true,
        included: false,
        nocache: true,
      },
    ]

  webideConfig.files = userFiles.concat(webideConfig.files)

  // coverage collection will slow down the performance and make debugging
  // difficult(due to instrumentation, so it is not enabled by default.
  if (coverageMode) {
    const userPreprocessors = {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      "src/**/*.js": ["coverage"],
    }

    webideConfig.preprocessors = Object.assign(
      {},
      webideConfig.preprocessors,
      userPreprocessors
    )

    // optionally augment coverageReporter config to enable thresholds checks.
    // see more options in: https://github.com/karma-runner/karma-coverage/blob/master/docs/configuration.md
    webideConfig.coverageReporter = Object.assign(
      {},
      webideConfig.coverageReporter,
      {
        check: {
          // TODO: increase these numbers for practical usage :)
          global: {
            statements: 10,
            branches: 10,
            functions: 10,
            lines: 10,
          },
        },
      }
    )
  }

  // augment the browser runtime with the command line arguments
  webideConfig.client = Object.assign({}, webideConfig.client, argv)

  config.set(webideConfig)
}
