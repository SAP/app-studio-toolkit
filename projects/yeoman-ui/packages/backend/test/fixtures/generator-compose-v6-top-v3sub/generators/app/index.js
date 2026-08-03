"use strict";

// A modern (yeoman-generator v6) top generator that composes a sub-generator
// which only works on the legacy v3 runtime. Because the top is v6-based, the
// whole run routes to v6 and the sub fails at writing time
const Generator = require("yeoman-generator");
const Base = Generator.default || Generator;

module.exports = class ComposeV6TopV3SubGenerator extends Base {
  async writing() {
    await this.composeWith(
      {
        Generator: require("../../../generator-compose-v3-only-sub/generators/app/index.js"),
        path: require.resolve(
          "../../../generator-compose-v3-only-sub/generators/app/index.js"
        ),
      },
      this.options
    );
  }
};
