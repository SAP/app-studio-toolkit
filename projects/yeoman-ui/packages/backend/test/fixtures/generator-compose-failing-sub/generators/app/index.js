"use strict";

// A sub-generator whose writing phase throws, to exercise the composed
// sub-generator failure path (the error must surface to the caller)
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

const SUB_WRITING_ERROR = "compose-failing-sub writing() blew up on purpose";

module.exports = class ComposeFailingSubGenerator extends Base {
  writing() {
    throw new Error(SUB_WRITING_ERROR);
  }
};

module.exports.SUB_WRITING_ERROR = SUB_WRITING_ERROR;
