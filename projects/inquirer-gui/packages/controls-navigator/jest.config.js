module.exports = {
  verbose: true,
  testEnvironment: "jest-environment-jsdom",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  coverageProvider: "v8",
  testRegex: "(/__tests__/(.*).(test|spec)).[jt]sx?$" /* eslint-disable-line */,
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
    ["lcov", { projectRoot: "../../" }],
    ["html", { projectRoot: "../../" }],
    "text-summary",
  ],
  moduleFileExtensions: ["js", "vue", "json"],
  transformIgnorePatterns: [
    // pnpm stores deps under node_modules/.pnpm/<dir>/node_modules/<name>, where <dir>
    // is "<name>@<version>" for unscoped and "@<scope>+<name>@<version>" for scoped
    // packages (the "/" in a scope becomes "+"). Jest matches against the REAL
    // (symlink-resolved) path, so ESM deps are allow-listed by their .pnpm dir form.
    "/node_modules/.pnpm/(?!(@sap-devx\\+|vuetify@|@vscode-elements\\+|material-design-icons-iconfont@|@mdi\\+font@))",
  ],
  modulePaths: ["<rootDir>/src", "node_modules"],
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
      branches: 96,
      functions: 96,
      lines: 96,
      statements: 96,
    },
  },
};
