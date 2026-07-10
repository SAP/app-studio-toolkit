"use strict";

module.exports = class EnvV3FixtureGenerator {
  constructor(args, opts) {
    this.args = args;
    this.options = opts;
    this.env = opts && opts.env;
    this.envV3FixtureLoaded = true;
  }

  initializing() {
    return "env-v3-fixture-initialized";
  }
};
