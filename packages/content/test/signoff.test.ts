import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkSignoff, isPackSignedOff, loadSignoffRegistry, signoffRegistrySchema } from "../src/signoff.js";
import type { ResolvedAtom } from "../src/schema.js";

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const REGISTRY_PATH = path.join(REPO_ROOT, "compliance", "sign-off-registry.yaml");

function atom(status: ResolvedAtom["status"], pack = "smoking"): ResolvedAtom {
  return {
    id: `${pack}.test.atom`,
    type: "message",
    body: "Hello",
    channelVariants: {},
    toneVariants: {},
    slots: [],
    bct: [{ code: "1.1", label: "Goal setting (behaviour)" }],
    comB: ["reflective-motivation"],
    readingAge: 9,
    tone: "autonomy-supportive",
    channels: ["app"],
    vertical: "smoking",
    contraindications: [],
    status,
    language: "en-GB",
    pack,
    module: "test",
  };
}

const ENTRY = {
  id: "smoking-pack-v1",
  artifact: "content/smoking@abc123",
  scope: "content accuracy and safety",
  signed_by: "Dr Example (clinical reviewer)",
  date: "2026-06-12",
  gate: "G2",
};

describe("sign-off registry", () => {
  it("loads the real registry (currently empty — nothing cleared)", async () => {
    const registry = await loadSignoffRegistry(REGISTRY_PATH);
    expect(registry.entries).toEqual([]);
  });

  it("rejects malformed entries", () => {
    expect(signoffRegistrySchema.safeParse({ entries: [{ id: "x" }] }).success).toBe(false);
    expect(signoffRegistrySchema.safeParse({ entries: [{ ...ENTRY, date: "12/06/2026" }] }).success).toBe(false);
    expect(signoffRegistrySchema.safeParse({ entries: [ENTRY] }).success).toBe(true);
  });

  it("matches pack coverage on the artifact path", () => {
    const registry = signoffRegistrySchema.parse({ entries: [ENTRY] });
    expect(isPackSignedOff(registry, "smoking")).toBe(true);
    expect(isPackSignedOff(registry, "sleep")).toBe(false);
  });

  it("draft atoms need no entry; approved/locked atoms do (safety invariant 3)", () => {
    const empty = signoffRegistrySchema.parse({ entries: [] });
    expect(checkSignoff([atom("draft")], empty)).toEqual([]);
    expect(checkSignoff([atom("approved")], empty).length).toBe(1);
    expect(checkSignoff([atom("locked")], empty).length).toBe(1);
    const signed = signoffRegistrySchema.parse({ entries: [ENTRY] });
    expect(checkSignoff([atom("approved")], signed)).toEqual([]);
  });
});
