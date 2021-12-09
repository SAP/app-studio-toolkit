const baseConfig = require("../../.mocharc.js");

module.exports = {
  ...baseConfig,
  spec: "./dist/test/**/*spec.js",
  // TODO: large timeout only for specific tests
  timeout: 5000,
};
