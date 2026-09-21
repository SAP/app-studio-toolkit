const baseNycConfig = require("../../nyc.config");

module.exports = Object.assign(baseNycConfig, {
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  include: ["**/src/**"],
});
