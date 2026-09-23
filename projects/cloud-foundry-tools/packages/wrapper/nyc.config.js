module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  extension: [".js", ".ts", ".vue"],
  // Redirect coverage output away from the default .nyc_output so this VS Code
  // extension is NOT pulled into the root merged 100% gate (which targets the
  // library packages). It keeps its own thresholds, matching the
  // guided-development / yeoman-ui extension-backend precedent.
  "temp-dir": "./reports/.nyc_output",
  "report-dir": "./reports/coverage",
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  include: ["**/src/**"],
};
