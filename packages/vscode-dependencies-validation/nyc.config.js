module.exports = {
  include: "**/src/**",
  // We are excluding files from coverage for which tests would have too little value and too high TCO.
  // This is due to the difficulty of running/mocking vscode during the tests.
  exclude: [
    "src/extension.ts",
    "src/commands.ts",
    "src/logger/logger.ts",
    "src/diagnostics/refreshDiagnostics.ts",
  ],
};
