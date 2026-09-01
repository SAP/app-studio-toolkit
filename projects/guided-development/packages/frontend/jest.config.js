module.exports = {
  verbose: true,
  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.{js,vue}",
    "!**/node_modules/**",
    "!<rootDir>/src/main.js",
    "!<rootDir>/src/plugins/**"
  ],

  coverageReporters: [
    "lcov",
    "html",
    "text-summary"
  ],

  moduleFileExtensions: [
    "js",
    "vue",
    "json"
  ],

  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!(@sap-devx|vuetify)/)"
  ],

  modulePaths: [
    "<rootDir>/src",
    "<rootDir>/node_modules"
  ],

  transform: {
    ".*\\.(vue)$": "@vue/vue3-jest",
    '^.+\\.vue$': '@vue/vue3-jest',
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest",
    "^.+\\.mjs$": "<rootDir>/node_modules/babel-jest",
  },

  snapshotSerializers: [
    "<rootDir>/node_modules/jest-serializer-vue"
  ],

  coverageThreshold: {
    "global": {
      "branches": 17,
      "functions": 52,
      "lines": 32,
      "statements": 32
    }
  },

  preset: '@vue/cli-plugin-unit-jest'
}
