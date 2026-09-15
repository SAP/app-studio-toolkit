const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  exclude: [
    "src/logger/**",
    "test/**",
    "*.js",
    "scripts/**",
    "coverage/lcov-report/**",
    "dummy/main.js",
    "src/dummy.js",
    "dist/test/**",
    "dist/media/**",
    "src/webSocketServer/**",
  ],
  branches: 99,
  lines: 99,
  functions: 99,
  statements: 99,
});
