module.exports = {
  verbose: true,
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  setupFiles: [require.resolve("./packages/inquirer-gui/__tests__/setup.js")],
  coverageProvider: "v8",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/index.js",
    "!<rootDir>/src/plugins/**",
  ],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "reports/junit",
        outputName: "js-test-results.xml",
      },
    ],
  ],
  coverageReporters: [
    ["lcov", { projectRoot: "/" }],
    ["html", { projectRoot: "/" }],
    "text-summary",
  ],
  moduleFileExtensions: ["js", "vue", "json"],
  transformIgnorePatterns: [
    // pnpm stores deps under node_modules/.pnpm/<dir>/node_modules/<name>, where <dir>
    // is "<name>@<version>" for unscoped and "@<scope>+<name>@<version>" for scoped
    // packages (the "/" in a scope becomes "+"). Jest matches this pattern against the
    // REAL (symlink-resolved) path, so the ESM deps we must transform are allow-listed
    // by their .pnpm directory-name form.
    "/node_modules/.pnpm/(?!(@sap-devx\\+|vuetify@|@vscode-elements\\+|lit@|lit-html@|lit-element@|@lit\\+|@lit-labs\\+|material-design-icons-iconfont@|@mdi\\+font@))",
  ],
  modulePaths: ["<rootDir>/src", "<rootDir>/node_modules"],
  transform: {
    ".*\\.(vue)$": "@vue/vue3-jest",
    "^.+\\.vue$": "@vue/vue3-jest",
    ".+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$":
      "jest-transform-stub",
    "^.+\\.js$": "babel-jest",
    "^.+\\.mjs$": "babel-jest",
  },
  snapshotSerializers: ["jest-serializer-vue"],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
