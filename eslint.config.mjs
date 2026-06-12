import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/", "**/dist/", "**/.turbo/", "**/coverage/", "**/.next/", "**/.expo/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "error",
    },
  },
  {
    files: ["packages/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@preventos/*", "!@preventos/shared"],
              message: "packages/domain may only import @preventos/shared (plan §4.1 import boundary)",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@preventos/*"],
              message: "packages/shared imports no internal packages (plan §4.1 import boundary)",
            },
          ],
        },
      ],
    },
  },
);
