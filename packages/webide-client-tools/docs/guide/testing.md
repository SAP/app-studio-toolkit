# Testing for SAP Web IDE Features

## Introduction

**Terms and Definitions**

- [Karma](http://karma-runner.github.io/1.0/index.html) - is an open source test **runner** for JavaScript capable of executing tests on browsers.

- [Mocha](https://mochajs.org/) - is an open source JavaScript testing framework. It provides APIs for writing the test suites.

- [STF - Service Test Framework](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/resources/tests/serviceTestFramework.js) - is a proprietary JavaScript module that provides utilities for starting SAP Web IDE inside an _iframe_ for testing purposes.

- **Service test** - A test that manipulates SAP Web IDE services in a running SAP Web IDE instance.

- **Unit test** - A test that manipulates JavaScript modules directly (**No** SAP Web IDE instance involved).

The SAP Web IDE client tools repository contains utilities and an [example](https://github.com/SAP/app-studio-toolkit/tree/main/packages/webide-client-tools/example) on how to integrate the above tools to bootstrap a testing infrastructure for SAP Web IDE features.

## Running Tests for the Provided Example Feature

**Prerequisites**

- Node.js 6 or later
- Google Chrome browser

**Procedure**

1.  Clone the repository.
2.  Open the [example](../../example) directory.
3.  Run the following:
    `npm install`
    `npm test`

**Note**: "karma_tests" is simply an npm script that triggers the Karma CLI command:
`karma start --singleRun`
Additional information about karma configurations and CLI can be found in the [official karma documentation](http://karma-runner.github.io/1.0/intro/configuration.html).

## Debugging the Provided Example Feature Tests

**Additional Prerequisite**

- _karma-cli_ package installed **globally**
  npm install -g karma-cli

**Procedure**

1.  Open [example](https://github.com/SAP/app-studio-toolkit/tree/main/packages/webide-client-tools/example) directory.

    `karma start`

    A new Chrome browser opens in a URL similar to: http://localhost:9877/?id=16652698

    - ![Karma Chrome Window](./imgs/karma_browser.png)

2.  Press the **DEBUG** button at the top right corner of the screen.
    It now opens the URL: http://localhost:9877/debug.html
    ![Karma Debug Window](./imgs/karma_debug.png)

3.  Open Chrome Developer Tools and search for one of the test files, for example: _utilsUnitTestSpec.js_.

4.  Set a breakpoint in that file.

5.  Refresh the page.

**Note**: The UI/UX in the _debug.html_ file is quite useful.
Click on a test name to **only** run that test. Test failures are shown with detailed error messages in the UI.

## Integrating the Testing Infrastructure into Another Feature

Instead of creating a very large step-by-step guide which quickly becomes obsolete and incorrect,
the components of the example are listed with their purpose and are used as **live docs**.

### The Components:

#### DevDependencies:

- Found in [package.json](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/example/package.json)

- The _karma-\*_ package dependencies are plugins for Karma, for example: _karma-chrome-launcher_
  allows Karma to launch Chrome for testing. However, if we want to use Firefox we can install and configure
  the [karma-firefox-launcher](https://www.npmjs.com/package/karma-firefox-launcher) plugin.

- The _webide-client-tools_ package dependency is the **same** library developed in this repository.
  It is highly recommended for a more specific version range constraint; the usage of "\*" (latest) here is only for internal testing purposes.
- The _webide_ package dependency provides the static resources needed to run SAP Web IDE locally.

#### _karma_ configurations

- Found in [karma.conf.js](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/example/karma.conf.js)

- Defines the options for Karma to use.

- ```javascript
  const karmaTools = require("@sap-webide/webide-client-tools").karma
  const webideConfig = karmaTools.defaultProps()
  ```

  is used to obtain the default settings for the SAP Web IDE testing scenario.

- It is possible to add or overwrite configurations to support custom scenarios.
- Consult the [official documentation for Karma configurations](http://karma-runner.github.io/1.0/config/configuration-file.html)
  when making changes.

- By default, end users must "include" a reference to their _testSetup.js_ file and "serve" their test and production resources.
  **Note**: The _node_modules/chai/chai.js_ open source assertion library is used in the example tests.
  However, it is **not** part of the testing infrastructure and must be manually included if needed.

## Tests Runtime Configurations

- Found in [testSetup.js](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/example/test/testsSetup.js)

- This file is loaded in the browser to configure globals (_window_ global object properties) for enabling the test bootstrapping.

- The most important global is _window.TEST_FILE_PATTERN_, which defines a regular expression for identifying test files and loading them as _require.js_ file dependencies.

- **Note**: This file can also be used to define "end user" globals. In this example, _chai_ APIs are exposed as globals.

## The Tests Themselves

- Found in [serviceTestSpec.js](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/example/test/serviceTestSpec.js) and
  [utilsUnitTestSpec.js](https://github.com/SAP/app-studio-toolkit/blob/main/packages/webide-client-tools/example/test/utilsUnitTestSpec.js)

- The tests are written using Mocha _bdd_ APIs (describe/it/before/...) with _chai_ _expect_ APIs for assertions.

- The tests use _require.js_ to load dependencies.

- The service test loads STF (Service Tests Framework), which exposes APIs for testing SAP Web IDE in an _iframe_.
  - STF.startWebIDE(...)
  - See [API Docs](https://sap.github.io/webide-client-tools/web/html_docs/interfaces/_api_d_.stf_api.html) for detailed info.
