module.exports = {
  include: "**/src/**",
  /**
   * We are implementing tests as pure unit tests without excessive mocks for VSCode APIs
   * However not all source files can be tested using this approach.
   * This is an instance of getting 80% of the benefits for 20% of the cost
   */
  exclude: ["src/extension.ts", "src/logger.ts"],
};
