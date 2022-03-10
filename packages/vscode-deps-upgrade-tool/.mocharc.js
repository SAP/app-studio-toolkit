const baseConfig = require("../../.mocharc.js");

module.exports = {
  ...baseConfig,
  spec: "./dist/test/**/*spec.js",
};

const {valid, validRange, satisfies, subset} = require("semver")

const foo = 5;