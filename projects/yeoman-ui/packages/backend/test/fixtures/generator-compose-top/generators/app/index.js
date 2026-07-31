"use strict";

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
