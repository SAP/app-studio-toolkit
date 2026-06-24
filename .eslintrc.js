module.exports = {
  // Common settings for JS Files.
  extends: ["plugin:eslint-comments/recommended", "prettier"],
  env: {
    commonjs: true,
    es6: true,
    mocha: true,
    node: true,
  },
  rules: {
    "eslint-comments/require-description": ["error", { ignore: [] }],
  },
  overrides: [
    {
      // For pure-java script sub-packages and general scripts (in any package).
      files: ["*.js"],
      extends: ["eslint:recommended"],
      parserOptions: {
        // The `ecmaVersion` should align to the supported features of our target runtimes (browsers / nodejs / others)
        // Consult with: https://kangax.github.io/compat-table/es2016plus/
        ecmaVersion: 2018,
      },
    },
    {
      // For sub-packages using TypeScript (libraries/VSCode Exts) && TypeScript definitions (d.ts)
      files: ["*.ts"],
      plugins: ["@typescript-eslint"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["./tsconfig.base.json", "./tsconfig.json"],
      },
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
      ],
      rules: {
        "@typescript-eslint/no-use-before-define": [
          "error",
          // These can be safely used before they are defined due to function hoisting in EcmaScript
          { functions: false, classes: false },
        ],
        "@typescript-eslint/ban-ts-comment": [
          "error",
          {
            // We only allow ts-expect-error comments to enforce removal
            // of outdated suppression comments when the underlying issue has been resolved.
            // https://devblogs.microsoft.com/typescript/announcing-typescript-3-9/#what-about-ts-ignore
            "ts-expect-error": "allow-with-description",
            "ts-ignore": true,
            "ts-nocheck": true,
            "ts-check": true,
          },
        ],
        // Too many false positives from `restrict-template-expressions`, see:
        //  - https://github.com/typescript-eslint/typescript-eslint/issues/2261
        "@typescript-eslint/restrict-template-expressions": ["off"],
        // TODO: These rules should be enabled once the source code has been improved
        "@typescript-eslint/no-unsafe-assignment": ["off"],
        "@typescript-eslint/no-unsafe-member-access": ["off"],
        "@typescript-eslint/no-unsafe-call": ["off"],
      },
    },
    {
      // yeoman-ui was integrated with eslint-comments/require-description: "off"
      // TODO: enable this rule once existing comments have been annotated
      files: ["projects/yeoman-ui/**"],
      rules: {
        "eslint-comments/require-description": "off",
      },
    },
    {
      // These packages pre-date strict type-checked linting and have many existing violations.
      // Rules are relaxed to match the historical behaviour before the ESLint crash was fixed.
      // TODO: clean up violations and tighten these rules incrementally.
      files: [
        "packages/app-studio-remote-access/**/*.ts",
        "packages/app-studio-toolkit/**/*.ts",
        "packages/app-studio-toolkit-themes/**/*.ts",
        "packages/app-studio-toolkit-types/**/*.d.ts",
        "packages/npm-dependencies-validation/**/*.ts",
        "packages/vscode-dependencies-validation/**/*.ts",
        "packages/vscode-deps-upgrade-tool/**/*.ts",
        "packages/vscode-disk-usage/**/*.ts",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-duplicate-type-constituents": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/only-throw-error": "off",
        "@typescript-eslint/prefer-promise-reject-errors": "off",
        "@typescript-eslint/no-unsafe-enum-comparison": "off",
        "@typescript-eslint/no-base-to-string": "off",
        "@typescript-eslint/prefer-as-const": "off",
        "@typescript-eslint/no-use-before-define": "off",
      },
    },
    {
      // Additional TypeScript rules for yeoman-ui packages.
      files: ["projects/yeoman-ui/**/*.ts"],
      rules: {
        semi: "error",
        "no-extra-semi": "error",
        "no-eval": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-redundant-type-constituents": "off",
        "@typescript-eslint/no-wrapper-object-types": "off",
        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-unnecessary-type-assertion": "off",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/unbound-method": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", caughtErrors: "none" },
        ],
        "no-async-promise-executor": "off",
        "no-irregular-whitespace": "off",
        "prefer-rest-params": "off",
        "prefer-spread": "off",
      },
    },
    {
      // For Vue frontend sub-packages.
      files: ["*.vue"],
      parser: "vue-eslint-parser",
      // Using the smaller vue rule subset (essential) to avoid including formatting rules
      // as formatting is handled by prettier **directly**.
      extends: ["plugin:vue/vue3-essential"],
    },
  ],
};
