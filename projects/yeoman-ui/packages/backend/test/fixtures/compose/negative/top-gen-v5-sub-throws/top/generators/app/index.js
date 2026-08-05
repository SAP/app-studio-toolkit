"use strict";

// NEGATIVE scenario - legacy top generator (yeoman-generator v5) composing a
// sub-generator whose writing phase throws. Exercises the composed
// sub-generator failure path: the sub's own error must surface to the caller.
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class TopGenV5ComposingThrowingSub extends Base {
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
