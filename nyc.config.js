module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  //   - https://reflectoring.io/100-percent-test-coverage/
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
