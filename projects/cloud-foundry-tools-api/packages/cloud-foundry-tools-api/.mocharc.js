const baseConfig = require("../../../../.mocharc.js");

module.exports = {
  ...baseConfig,
  spec: "./out/tests/**/*spec.js",
  timeout: 80000,
};
