"use strict";

// A modern (yeoman-generator v6) sub-generator. Requires the v6 runtime
const Generator = require("yeoman-generator");
const Base = Generator.default || Generator;

module.exports = class ComposeV6SubGenerator extends Base {
  writing() {
    // Signal on the shared env options so the test can observe the sub ran
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
