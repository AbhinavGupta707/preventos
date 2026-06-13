import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sha256Hex } from "../src/hash.js";

const nodeHash = (s: string) => createHash("sha256").update(s).digest("hex");

describe("sha256Hex", () => {
  it("matches the known SHA-256 vector for 'hello'", () => {
    expect(sha256Hex("hello")).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  });

  it("is byte-identical to node:crypto across varied inputs (pinning the migration)", () => {
    for (const s of ["", "a", "smoking.quit.russell_standard_4w", JSON.stringify({ v: "svc-default-1", n: 42 }), "ünïcødé 🌿"]) {
      expect(sha256Hex(s)).toBe(nodeHash(s));
    }
  });
});
