const ts = require("typescript-eslint");

module.exports = ts.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "playwright-report/",
      "test-results/",
      ".runtime/",
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [...ts.configs.recommended],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  }
);
