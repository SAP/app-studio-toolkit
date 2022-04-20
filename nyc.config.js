module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  // TODO: avoid duplication with the exclusions in each package's nyc.config.js
  exclude: [
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
