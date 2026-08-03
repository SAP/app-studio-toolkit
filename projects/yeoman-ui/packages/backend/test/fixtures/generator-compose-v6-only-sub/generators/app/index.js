"use strict";

// A modern (yeoman-generator v8) sub-generator. Its base class hard-requires
// yeoman-environment >= 4, so it cannot even be instantiated on the legacy v3
// runtime ("requires yeoman-environment ...")
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class ComposeV6OnlySubGenerator extends Base {
  writing() {
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};
