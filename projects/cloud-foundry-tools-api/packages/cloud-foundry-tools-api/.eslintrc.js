/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  env: {
    browser: true,
    node: true,
  },
  // Based on https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#recommended-configs
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    // prettier must be last because it turns off previous rules
    "prettier",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 6,
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
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
    semi: "error",
    "no-extra-semi": "error",
    "no-eval": "error",
    "@typescript-eslint/prefer-readonly": "error",
    // Too many false positives from `restrict-template-expressions`, see:
    //  - https://github.com/typescript-eslint/typescript-eslint/issues/2261
    "@typescript-eslint/restrict-template-expressions": ["off"],
    // TODO: These rules should be enabled once the source code has been improved
    "@typescript-eslint/no-unsafe-assignment": ["off"],
    "@typescript-eslint/no-unsafe-member-access": ["off"],
    "@typescript-eslint/no-unsafe-call": ["off"],
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: ["**/*.spec.ts"], optionalDependencies: false, peerDependencies: false },
    ],
    // note you must disable the base rule as it can report incorrect errors
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn"],
  },
};
