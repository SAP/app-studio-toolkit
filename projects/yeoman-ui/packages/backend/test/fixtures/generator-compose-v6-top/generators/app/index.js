"use strict";

// A modern (yeoman-generator v6) top generator that composes a v6 sub-generator
const Generator = require("yeoman-generator");
const Base = Generator.default || Generator;

module.exports = class ComposeV6TopGenerator extends Base {
  async writing() {
    await this.composeWith(
      {
        Generator: require("../../../generator-compose-v6-sub/generators/app/index.js"),
        path: require.resolve(
          "../../../generator-compose-v6-sub/generators/app/index.js"
        ),
      },
      this.options
    );
  }
};
