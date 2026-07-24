"use strict";

const Generator = require("yeoman-generator").default;

module.exports = class EnvV6FixtureGenerator extends Generator {
  // A trivial lifecycle method so the class is a valid, instantiable generator.
  initializing() {
    this.envV6FixtureLoaded = true;
  }
};
