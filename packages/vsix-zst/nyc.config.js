module.exports = {
  all: true,
  "check-coverage": true,
  include: ["src/**/*.ts", "dist/src/**/*.js"],
  exclude: ["dist/src/**/*.d.ts"],
  excludeAfterRemap: false,
  extension: [".js", ".ts"],
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
};
