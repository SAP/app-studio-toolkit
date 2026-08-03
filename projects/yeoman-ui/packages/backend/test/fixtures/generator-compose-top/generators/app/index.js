"use strict";

// A legacy (yeoman-generator v5) top generator that composes a legacy
// sub-generator. It instantiates on the v3 runtime, so the whole run routes to
// v3 and its composed sub-generator runs to completion - the happy-path
// baseline for legacy composition
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class ComposeTopGenerator extends Base {
  writing() {
    this.composeWith(
      {
        Generator: require("../../../generator-compose-sub/generators/app/index.js"),
        path: require.resolve(
          "../../../generator-compose-sub/generators/app/index.js"
        ),
      },
      this.options
    );
  }
};
