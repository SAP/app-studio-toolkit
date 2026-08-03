"use strict";

// A legacy (yeoman-generator v5) sub-generator composed by generator-compose-top.
// It runs on the v3 runtime and signals, via the shared env options, that its
// writing phase executed - the happy-path baseline for legacy composition
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
