module.exports = {
  require: ["ts-node/register/transpile-only", "source-map-support/register"],
  recursive: true,
  spec: "tests/**/*.spec.ts",
  timeout: 80000,
};
