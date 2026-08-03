"use strict";

// NEGATIVE scenario - modern sub-generator (yeoman-generator v8). Its base class
// hard-requires yeoman-environment >= 4, so it cannot even be instantiated on
// the legacy v3 runtime ("requires yeoman-environment ...").
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class SubGenV8Only extends Base {
  writing() {
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
