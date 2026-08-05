"use strict";

// A minimal modern (yeoman-generator v8) generator with no composition. Used as
// the default, happy-path fixture for the mocked createRunGen tests - it
// instantiates and runs on the v6 runtime on its own.
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class StandaloneGenV8 extends Base {
  // A trivial lifecycle method so the class is a valid, instantiable generator.
  initializing() {
    this.standaloneGenV8Loaded = true;
  }
};
