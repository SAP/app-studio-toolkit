const baseConfig = require("../../.mocharc.js");

module.exports = {
  ...baseConfig,
  spec: "./dist/tests/**/*.spec.js",
  timeout: 15000,
};
