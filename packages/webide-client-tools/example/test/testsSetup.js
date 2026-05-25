// A RegExp specifying the pattern for identifying test files.
// These files will be loaded as require.js dependencies during the tests.
window.TEST_FILE_PATTERN = /test\/.*Spec\.js$/

// This custom requirejs path allows requiring resources using requirejs easily in test files.
// "define(['webide-plugin-example/service/helloUtils'], function (helloUtils) {..."
window.CUSTOM_REQUIREJS_PATHS = {
  "webide-plugin-example": "/base/src/webide-plugin-example",
}

// optional: exposing some globals for our tests
window.expect = chai.expect
window.assert = chai.assert
