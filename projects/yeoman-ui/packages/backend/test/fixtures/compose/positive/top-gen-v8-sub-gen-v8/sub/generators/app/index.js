"use strict";

// POSITIVE scenario - modern sub-generator (yeoman-generator v8) composed by the
// v8 top generator. It runs on the yeoman-environment v6 runtime and signals,
// via the shared env options, that its writing phase executed.
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class SubGenV8 extends Base {
  writing() {
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
