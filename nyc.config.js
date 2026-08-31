module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  // TODO: avoid duplication with the exclusions in each package's nyc.config.js
  exclude: [
    ".vscode-test/**",
    // `all: true` + `include: "**/src/**"` would otherwise pull compiled build
    // output (dist/src/**), type declarations, and test sources into the merged
    // report as 0%-covered files, sinking the global percentage well below the
    // real (per-package) coverage. Only real, instrumentable source counts here.
    "**/dist/**",
    "**/*.d.ts",
    "**/test/**",
    "packages/vscode-dependencies-validation/src/commands.ts",
    "packages/vscode-dependencies-validation/src/logger/logger.ts",
    "packages/vscode-deps-upgrade-tool/src/logger.ts",
  ],
  //   - https://reflectoring.io/100-percent-test-coverage/
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
