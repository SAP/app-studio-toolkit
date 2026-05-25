const baseConfig = require("../../.mocharc.js");

module.exports = {
  ...baseConfig,
  spec: "./dist/test/**/*spec.js",
  require: "./dist/test/setup.js",
};
