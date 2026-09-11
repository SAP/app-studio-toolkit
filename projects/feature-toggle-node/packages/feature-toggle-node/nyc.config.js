module.exports = {
  extends: "@istanbuljs/nyc-config-typescript",
  include: ["src/**/*.ts"],
  // These files are integration/example glue not exercised by the unit suite;
  // excluded from the source repo's 100% gate and kept excluded here.
  exclude: [
    "src/example/example.ts",
    "src/example/example_simple.ts",
    "src/request.ts",
    "src/utils.ts",
  ],
  reporter: ["text", "lcov"],
  "check-coverage": true,
  all: true,
  branches: 100,
  lines: 100,
  functions: 100,
  statements: 100,
};
