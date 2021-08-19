module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  include: "**/src/**",
  // TODO: get to 100%?
  //   - https://reflectoring.io/100-percent-test-coverage/
  branches: 95,
  lines: 96,
  functions: 96,
  statements: 96,
  // TODO: evaluate this need in a ts only repo
  // To enable **merged** coverage report all relevant file extensions must be listed.
  extension: [".js", ".ts"],
};
