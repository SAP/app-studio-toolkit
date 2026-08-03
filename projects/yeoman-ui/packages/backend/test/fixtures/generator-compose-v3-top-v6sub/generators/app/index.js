"use strict";

// A legacy (yeoman-generator v3) top generator that composes a sub-generator
// which only works on the modern v6+ runtime. The top instantiates on v3, so
// the whole run routes to v3; composing the v6-only sub then fails because the
// sub's base class requires yeoman-environment >= 4
const Generator = require("yeoman-generator-v3");
const Base = Generator.default || Generator;

module.exports = class ComposeV3TopV6SubGenerator extends Base {
  writing() {
    this.composeWith(
      {
        Generator: require("../../../generator-compose-v6-only-sub/generators/app/index.js"),
        path: require.resolve(
          "../../../generator-compose-v6-only-sub/generators/app/index.js"
        ),
      },
      this.options
    );
  }
};
