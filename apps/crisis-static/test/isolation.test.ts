import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ESLint } from "eslint";

const html = readFileSync(join(import.meta.dirname, "..", "public", "index.html"), "utf8");

describe("crisis-static — content", () => {
  const numbers = [
    ["999", "emergency"],
    ["111", "NHS 111"],
    ["116 123", "Samaritans"],
    ["85258", "Shout"],
    ["0808 2000 247", "National Domestic Abuse Helpline"],
    ["0808 800 5000", "NSPCC"],
    ["0800 1111", "Childline"],
    ["0300 123 1110", "Drinkline"],
  ] as const;
  it.each(numbers)("lists %s (%s)", (num) => {
    expect(html).toContain(num);
  });

  it("carries the E17 alcohol warning: never advise abrupt cessation", () => {
    expect(html.toLowerCase()).toContain("do not suddenly stop drinking");
  });

  it("makes no treatment claims about sleep (invariant 5 posture)", () => {
    expect(html.toLowerCase()).not.toMatch(/cure|treats? insomnia|clinically proven/);
  });
});

describe("crisis-static — isolation and 2am-safety", () => {
  it("contains no JavaScript at all", () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/\bon[a-z]+=/i);
  });

  it("makes no external network requests (offline-capable)", () => {
    expect(html).not.toMatch(/https?:\/\//i);
    expect(html).not.toMatch(/@import|url\(/i);
  });

  it("is dark by default with light-mode opt-in (night-safe rendering)", () => {
    expect(html).toContain('name="color-scheme" content="dark light"');
    expect(html).toContain("prefers-color-scheme: light");
  });

  it("links every phone number as a tel: target", () => {
    for (const tel of ["tel:999", "tel:116123", "tel:111", "tel:08082000247", "tel:08088005000", "tel:08001111", "tel:03001231110"]) {
      expect(html).toContain(`href="${tel}"`);
    }
  });
});

describe("crisis-static — platform-import lint boundary (negative proof)", () => {
  it("eslint rejects any @preventos import inside this app", async () => {
    const eslint = new ESLint({ cwd: join(import.meta.dirname, "..", "..", "..") });
    const [result] = await eslint.lintText('import { classify } from "@preventos/safety";\n', {
      filePath: join(import.meta.dirname, "fixture-violation.ts"),
    });
    const boundary = result?.messages.find((m) => m.ruleId === "no-restricted-imports");
    expect(boundary).toBeDefined();
    expect(boundary?.message).toContain("isolated");
  });

  it("the same import is allowed elsewhere in the monorepo (rule is scoped, not global)", async () => {
    const eslint = new ESLint({ cwd: join(import.meta.dirname, "..", "..", "..") });
    const [result] = await eslint.lintText('import { classify } from "@preventos/safety";\nclassify("x");\n', {
      filePath: join(import.meta.dirname, "..", "..", "..", "packages", "events", "src", "fixture.ts"),
    });
    expect(result?.messages.find((m) => m.ruleId === "no-restricted-imports")).toBeUndefined();
  });
});
