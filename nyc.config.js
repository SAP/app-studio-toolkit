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
    "packages/app-studio-toolkit/src/authentication/authProvider.ts",
    "packages/app-studio-toolkit/src/devspace-manager/tunnel/ssh.ts",
  ],
  //   - https://reflectoring.io/100-percent-test-coverage/
  branches: 98,
  lines: 98,
  functions: 98,
  statements: 98,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
