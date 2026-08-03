"use strict";

// POSITIVE scenario - modern top generator (yeoman-generator v8) composing a
// modern sub-generator (also v8).
//
// The v8 base class requires yeoman-environment >= 4, so it cannot instantiate
// on the v3 runtime; createRunGen therefore routes the whole composition to the
// v6 runtime, where both generators run to completion.
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class TopGenV8 extends Base {
  async writing() {
    await this.composeWith(
      {
        Generator: require("../../../sub/generators/app/index.js"),
        path: require.resolve("../../../sub/generators/app/index.js"),
      },
      this.options
    );
  }
};
