const baseConfig = require("../../.mocharc.js");

const subPkgConfig = {
  timeout: 7000,
};

module.exports = { ...baseConfig, ...subPkgConfig };
