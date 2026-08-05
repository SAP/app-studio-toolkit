"use strict";

// NEGATIVE scenario - sub-generator (yeoman-generator v5) whose writing phase
// throws on purpose, to verify that a composed sub-generator's own error
// propagates to the caller.
const Generator = require("yeoman-generator-v5");
const Base = Generator.default || Generator;

const SUB_WRITING_ERROR = "sub-generator writing() blew up on purpose";

module.exports = class SubGenThrows extends Base {
  writing() {
    throw new Error(SUB_WRITING_ERROR);
  }
};

module.exports.SUB_WRITING_ERROR = SUB_WRITING_ERROR;
