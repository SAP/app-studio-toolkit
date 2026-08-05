"use strict";

// POSITIVE scenario - legacy top generator (yeoman-generator v5) composing a
// legacy sub-generator (also v5).
//
// Both generators instantiate on the yeoman-environment v3 runtime, so
// createRunGen routes the whole composition to v3 and the sub-generator runs to
// completion. This is the happy-path baseline for legacy composition.
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class TopGenV5 extends Base {
  writing() {
    this.composeWith(
      {
        Generator: require("../../../sub/generators/app/index.js"),
        path: require.resolve("../../../sub/generators/app/index.js"),
      },
      this.options
    );
  }
};
