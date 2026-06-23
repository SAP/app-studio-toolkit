module.exports = {
  reporter: ["text", "lcov"],
  include: ["dist/src/**"],
  exclude: ["dist/src/logger/**"],
  branches: 80,
  lines: 80,
  functions: 80,
  statements: 80,
  "check-coverage": true,
  excludeAfterRemap: false,
  all: true,
};
