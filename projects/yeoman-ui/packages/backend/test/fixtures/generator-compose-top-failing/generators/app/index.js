"use strict";

// A top generator that composes a sub-generator whose writing phase throws
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class ComposeTopFailingGenerator extends Base {
  writing() {
    this.composeWith(
      {
        Generator: require("../../../generator-compose-failing-sub/generators/app/index.js"),
        path: require.resolve(
          "../../../generator-compose-failing-sub/generators/app/index.js"
        ),
      },
      this.options
    );
  }
};
