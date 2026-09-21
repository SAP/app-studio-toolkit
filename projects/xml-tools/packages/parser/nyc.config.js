module.exports = {
  // xml-tools sources live in lib/ (not src/), so this local config overrides
  // the repo-root nyc.config.js include of **/src/** (which would report 0%).
  include: ["lib/**/*.js"],
  reporter: ["text", "lcov"],
  all: true,
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
};
