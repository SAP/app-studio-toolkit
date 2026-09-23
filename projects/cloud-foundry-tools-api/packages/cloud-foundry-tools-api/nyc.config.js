module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: ["out/src/**"],
  exclude: [],
  // compiled tests + source-map remap; mirrors vscode-mta-tools' config so nyc
  // does not drop remapped files and report a false-green.
  excludeAfterRemap: false,
  branches: 99,
  lines: 99,
  functions: 98,
  statements: 99,
  extension: [".js", ".ts"],
};
