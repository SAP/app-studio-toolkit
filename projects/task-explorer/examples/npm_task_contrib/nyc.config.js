const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  exclude: ["*.js", "scripts/**", "coverage/lcov-report/**", "**/test/**"],
});
