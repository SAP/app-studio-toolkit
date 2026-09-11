module.exports = {
  // Self-contained ESLint island for the inquirer-gui Vue project, mirroring how
  // yeoman-ui-frontend and guided-development-frontend are integrated: a Vue frontend
  // needs vue-eslint-parser (+ @babel/eslint-parser for ESM .js) which is awkward to
  // express as a root override sitting next to the monorepo's type-aware TS linting.
  // `root: true` stops the cascade here so all 10 packages share this one config,
  // reproducing the source repo's single root .eslintrc.js.
  root: true,
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true,
    node: true,
    // Vue 3 <script setup> compiler macros (defineProps/defineEmits/defineExpose)
    // are globals, not imports.
    "vue/setup-compiler-macros": true,
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential", "prettier"],
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@babel/eslint-parser",
    requireConfigFile: false,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  globals: {
    _: "readonly",
    document: "readonly",
    __dirname: "readonly",
    __values: "readonly",
    process: "readonly",
    acquireVsCodeApi: "readonly",
  },
  plugins: ["vue"],
  rules: {
    // Tells no-unused-vars that <script setup> bindings referenced in <template>
    // are used (otherwise every template-only ref is flagged). Normally implied by
    // vue3-essential but must be explicit under this parser/plugin combination.
    "vue/script-setup-uses-vars": "error",
    // Preserved from the source repo (SAP/inquirer-gui) as-is; migrated code was not
    // rewritten. TODO: clean up violations and tighten incrementally.
    "vue/no-mutating-props": "off",
    "vue/no-deprecated-slot-attribute": "off",
  },
  overrides: [
    {
      // Node-context config files parsed as CommonJS scripts.
      files: [".eslintrc.{js,cjs}", "babel.config.js", "jest.config.js"],
      env: {
        node: true,
      },
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      // For sub-packages using TypeScript (libraries / VSCode Exts) && TS definitions (d.ts).
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "no-inner-declarations": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/ban-types": "off",
        "no-param-reassign": ["error", { props: true }],
      },
    },
  ],
};
