module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  //   - https://reflectoring.io/100-percent-test-coverage/
  // TODO: revert to 100%
  branches: 1,
  lines: 1,
  functions: 1,
  statements: 1,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
