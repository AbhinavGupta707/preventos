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
    // W3-SAFEPORT: the pure classifier surface (everything except queue.ts) must
    // stay db-free so `@preventos/safety/classify` is bundler-safe for mobile/web.
    files: ["packages/safety/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@preventos/db",
                "@preventos/db/*",
                "@preventos/events",
                "@preventos/events/*",
                "drizzle-orm",
                "drizzle-orm/*",
                "pg",
                "pg/*",
              ],
              message:
                "the pure classifier entry must stay db-free (W3-SAFEPORT): @preventos/safety/classify is bundled into mobile/web. Only ./queue.ts — reached via the package root @preventos/safety — may touch the database.",
            },
          ],
        },
      ],
    },
  },
  {
    // queue.ts is the deliberate exception: the db-backed escalation queue.
    files: ["packages/safety/src/queue.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
);
