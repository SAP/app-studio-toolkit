module.exports = {
  parserOptions: {
    ecmaVersion: "latest",
    // The frontend sources and tests use ES modules.
    sourceType: "module",
  },
  globals: {
    // Provided by the VS Code webview host when this frontend runs inside VS Code.
    acquireVsCodeApi: "readonly",
  },
  rules: {
    // Legacy single-word component name (Done.vue) migrated as-is.
    "vue/multi-word-component-names": "off",
  },
  overrides: [
    {
      files: ["test/**/*.js"],
      env: {
        jest: true,
      },
    },
  ],
};
