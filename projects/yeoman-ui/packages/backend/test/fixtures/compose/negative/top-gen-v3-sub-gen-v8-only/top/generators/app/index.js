"use strict";

// NEGATIVE scenario - legacy top generator (yeoman-generator v3) composing a
// sub-generator that only works on the modern v6+ runtime.
//
// The top instantiates on v3, so the whole run routes to v3. Composing the
// v8-only sub then fails because the sub's base class hard-requires
// yeoman-environment >= 4 ("requires yeoman-environment ...").
const Generator = require("yeoman-generator-v3");
const Base = Generator.default || Generator;

module.exports = class TopGenV3ComposingV8OnlySub extends Base {
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
