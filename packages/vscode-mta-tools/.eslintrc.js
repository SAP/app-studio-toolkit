module.exports = {
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:eslint-comments/recommended"],
  rules: {
    "no-unused-expressions": "off",
    "eslint-comments/require-description": "off",
  },
  ignorePatterns: ["dist/**"],
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/no-use-before-define": [
          "error",
          { functions: false },
        ],
        "@typescript-eslint/no-unused-expressions": ["error"],
        "@typescript-eslint/no-floating-promises": [
          "error",
          { ignoreVoid: true },
        ],
        "@typescript-eslint/strict-boolean-expressions": [
          "error",
          { allowString: true, allowNullableString: true, allowAny: true },
        ],
        "@typescript-eslint/no-explicit-any": ["off"],
        "@typescript-eslint/explicit-module-boundary-types": ["off"],
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/unbound-method": "off",
      },
    },
    {
      files: ["tests/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unused-expressions": "off",
        "@typescript-eslint/no-misused-promises": "off",
      },
    },
  ],
};
