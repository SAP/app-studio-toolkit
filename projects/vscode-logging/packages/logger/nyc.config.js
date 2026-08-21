module.exports = {
  include: ["lib/**/*.js"],
  reporter: ["text", "lcov"],
  // logger's tests use proxyquire; without this nyc drops the remapped
  // lib/ files after remap and reports 0% (a false-green against the 100%
  // gate). Mirrors the wrapper package's nyc.config.js.
  excludeAfterRemap: false,
};
