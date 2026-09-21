module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  extension: [".js", ".ts", ".vue"],
  // Redirect coverage output away from the default .nyc_output so this VS Code
  // extension is NOT pulled into the root merged 100% gate (which targets the
  // library packages). It keeps its own realistic thresholds, matching the
  // guided-development / yeoman-ui extension-backend precedent.
  "temp-dir": "./reports/.nyc_output",
  "report-dir": "./reports/coverage",
  branches: 90,
  lines: 95,
  functions: 91,
  statements: 95,
  include: ["**/src/**"],
  exclude: ["**/src/run-configuration-*", "**/src/sql-tools.ts", "**/src/logger/logger-wrapper.ts", "**/usage/*.ts"],
};
