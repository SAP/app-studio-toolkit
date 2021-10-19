module.exports = {
  // Common settings for JS Files.
  extends: ["plugin:eslint-comments/recommended", "prettier"],
  env: {
    commonjs: true,
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
        ecmaVersion: 2017,
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
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
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
        "@typescript-eslint/no-misused-promises": [
          "error",
          {
            // This sub-rule seems to detect issues which are technically true
            // but do not seem to have an adverse effect most of the time
            // so fixing the "issue" results worse code (not using async/await)
            // See: https://stackoverflow.com/questions/67114152/typescript-eslint-throwing-a-promise-returned-error-on-a-express-router-async
            checksVoidReturn: false,
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
  ],
};
