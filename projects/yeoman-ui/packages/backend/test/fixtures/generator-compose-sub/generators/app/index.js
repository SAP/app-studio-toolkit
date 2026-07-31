"use strict";

const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class ComposeSubGenerator extends Base {
  writing() {
    // Signal on the shared env options so the test can observe the sub ran
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
