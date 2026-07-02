module.exports = {
  reporter: ["text", "lcov"],
  include: ["dist/src/**"],
  exclude: ["dist/src/logger/**"],
  branches: 90,
  lines: 95,
  functions: 90,
  statements: 95,
  "check-coverage": true,
  excludeAfterRemap: false,
  all: true,
};
