module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  "temp-dir": "./reports/.nyc_output",
  "report-dir": "./reports/coverage",
  include: "**/src/**",
  exclude: [],
  branches: 99,
  lines: 99,
  functions: 98,
  statements: 99,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
