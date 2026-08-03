"use strict";

// A legacy (yeoman-generator v3) sub-generator that additionally needs a
// yeoman-environment v3-only feature. On the modern v6 runtime this throws the
// exact "necessary feature" error the real @bas-dev sub-generators throw,
// modelling the @sap/fiori:adp regression
const Generator = require("yeoman-generator-v3");
const Base = Generator.default || Generator;

const V3_ONLY_FEATURE_ERROR =
  "Current environment doesn't provides some necessary feature this generator needs.";

module.exports = class ComposeV3OnlySubGenerator extends Base {
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
