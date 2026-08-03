"use strict";

// NEGATIVE scenario - modern top generator (yeoman-generator v8) composing a
// sub-generator that only works on the legacy v3 runtime.
//
// Because the top is v8-based it instantiates only on the v6 runtime, so the
// whole run routes to v6. The composed v3-only sub then fails at writing() time.
// This models the real @sap/fiori:adp regression the other way around: a
// composition that lands on the runtime the sub-generator cannot use.
const Generator = require("yeoman-generator-v8");
const Base = Generator.default || Generator;

module.exports = class TopGenV8ComposingV3OnlySub extends Base {
  async writing() {
    await this.composeWith(
      {
        Generator: require("../../../sub/generators/app/index.js"),
        path: require.resolve("../../../sub/generators/app/index.js"),
      },
      this.options
    );
  }
};
