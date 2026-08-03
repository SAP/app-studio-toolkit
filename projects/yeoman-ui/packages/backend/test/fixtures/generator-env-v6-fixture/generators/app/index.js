"use strict";

// A minimal modern (yeoman-generator v6) generator used as the default,
// happy-path fixture for createRunGen tests - it instantiates and runs on the
// v6 runtime without any composition
const Generator = require("yeoman-generator").default;

module.exports = class EnvV6FixtureGenerator extends Generator {
  // A trivial lifecycle method so the class is a valid, instantiable generator.
  initializing() {
    this.envV6FixtureLoaded = true;
  }
};
