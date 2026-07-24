"use strict";

const Generator = require("yeoman-generator").default;

const V6_INIT_ERROR = "env-v6 fixture constructor failed on purpose";

module.exports = class EnvV6InitErrorFixtureGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
    throw new Error(V6_INIT_ERROR);
  }
};

module.exports.V6_INIT_ERROR = V6_INIT_ERROR;
