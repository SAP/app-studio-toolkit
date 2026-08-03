"use strict";

// POSITIVE scenario - legacy sub-generator (yeoman-generator v5) composed by the
// v5 top generator. It runs on the yeoman-environment v3 runtime and signals,
// via the shared env options, that its writing phase executed so the test can
// assert the composition actually ran.
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

module.exports = class SubGenV5 extends Base {
  writing() {
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
