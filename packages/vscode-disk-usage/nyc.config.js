module.exports = {
  include: ["src/**/*.ts", "dist/src/**/*.js"],
  exclude: [
    "src/logger/logger.ts", // logger is not unit tested as it depends on VSCode.
  ],
};
