module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  extension: [".js", ".ts", ".vue"],
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  include: ["**/src/**"],
};
