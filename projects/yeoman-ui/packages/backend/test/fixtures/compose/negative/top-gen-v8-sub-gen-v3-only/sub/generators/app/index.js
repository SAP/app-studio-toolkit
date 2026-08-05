"use strict";

// NEGATIVE scenario - sub-generator (yeoman-generator v3) that additionally
// needs a yeoman-environment v3-only feature. When composed onto the v6 runtime
// it throws the exact "necessary feature" error the real @bas-dev
// sub-generators throw on v6.
const Generator = require("yeoman-generator-v3");
const Base = Generator.default || Generator;

const V3_ONLY_FEATURE_ERROR =
  "Current environment doesn't provides some necessary feature this generator needs.";

module.exports = class SubGenV3Only extends Base {
  writing() {
    // Only the legacy yeoman-environment v3 runtime satisfies this generator.
    const version = this.env.getVersion ? this.env.getVersion() : "";
    if (!version.startsWith("3.")) {
      throw new Error(V3_ONLY_FEATURE_ERROR);
    }
    if (this.options && this.options.composeMarker) {
      this.options.composeMarker.subRan = true;
    }
  }
};

module.exports.V3_ONLY_FEATURE_ERROR = V3_ONLY_FEATURE_ERROR;
