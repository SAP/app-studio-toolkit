module.exports = {
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
  extension: [".js", ".ts", ".vue"],
  exclude: ["*.js", "scripts/**", "coverage/lcov-report/**", "**/test/**"],
};
