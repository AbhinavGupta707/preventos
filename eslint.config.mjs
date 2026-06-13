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
    files: ["apps/crisis-static/**/*.ts", "apps/crisis-static/**/*.tsx", "apps/crisis-static/**/*.mjs"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@preventos/*"],
              message:
                "apps/crisis-static is a fully isolated deployable: zero platform imports (plan WP7.2 — crisis resources must survive platform outage)",
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
  {
    files: ["packages/safety-core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@preventos/db", "@preventos/events", "@preventos/consent", "drizzle-orm", "pg"],
              message:
                "packages/safety-core is the pure, db-free classifier (W3-SAFEPORT) — it must stay importable by mobile/web, so no db or I/O deps",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/coach/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@preventos/db", "drizzle-orm", "pg"],
              message:
                "@preventos/coach is the db-free policy proxy — the db-backed log sink lives in apps/api behind the CoachLogSink port",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts", "tools/**/*.ts"],
    ignores: [
      "packages/coach/**",
      "packages/domain/**",
      "packages/shared/**",
      "packages/safety-core/**",
      "apps/crisis-static/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@anthropic-ai/sdk", "@anthropic-ai/sdk/*"],
              message:
                "The LLM is reachable only through @preventos/coach (the sole LLM path, plan E6/E7). Call the coach via runCoachTurn — never the Anthropic SDK directly.",
            },
          ],
        },
      ],
    },
  },
);
