import { describe, expect, it } from "vitest";
import { moduleFileSchema, rawAtomSchema, resolveAtoms } from "../src/schema.js";

const validAtom = {
  id: "smoking.test.atom",
  type: "message",
  body: "Hello",
  bcttv1: [{ code: "1.1", label: "Goal setting (behaviour)" }],
  com_b: ["reflective-motivation"],
};

const validMeta = {
  pack: "smoking",
  module: "test",
  status: "draft",
  schema: "preventos.content-atom/0.1",
  defaults: { vertical: "smoking" },
};

describe("rawAtomSchema", () => {
  it("accepts a minimal tagged atom", () => {
    expect(rawAtomSchema.safeParse(validAtom).success).toBe(true);
  });

  it("rejects atoms without BCT tags or without COM-B targets", () => {
    expect(rawAtomSchema.safeParse({ ...validAtom, bcttv1: [] }).success).toBe(false);
    expect(rawAtomSchema.safeParse({ ...validAtom, com_b: [] }).success).toBe(false);
  });

  it("rejects malformed BCT codes, bad ids, and missing body/steps", () => {
    expect(rawAtomSchema.safeParse({ ...validAtom, bcttv1: [{ code: "abc", label: "x" }] }).success).toBe(false);
    expect(rawAtomSchema.safeParse({ ...validAtom, id: "NotKebab" }).success).toBe(false);
    const noBody: Partial<typeof validAtom> = { ...validAtom };
    delete noBody.body;
    expect(rawAtomSchema.safeParse(noBody).success).toBe(false);
  });

  it("rejects undeclared slot placeholders in any text surface", () => {
    expect(rawAtomSchema.safeParse({ ...validAtom, body: "You saved {amount}" }).success).toBe(false);
    expect(
      rawAtomSchema.safeParse({ ...validAtom, slots: ["amount"], body: "You saved {amount}" }).success,
    ).toBe(true);
    expect(
      rawAtomSchema.safeParse({ ...validAtom, channel_variants: { push: "Saved {amount}" } }).success,
    ).toBe(false);
  });
});

describe("moduleFileSchema + resolveAtoms", () => {
  it("normalises status aliases used by drafting sessions", () => {
    const parsed = moduleFileSchema.safeParse({
      meta: { ...validMeta, status: "draft-pending-clinical-sign-off" },
      atoms: [validAtom],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.meta.status).toBe("draft");
  });

  it("rejects unknown statuses and unsupported schema versions", () => {
    expect(moduleFileSchema.safeParse({ meta: { ...validMeta, status: "shipped" }, atoms: [validAtom] }).success).toBe(
      false,
    );
    expect(
      moduleFileSchema.safeParse({ meta: { ...validMeta, schema: "preventos.content-atom/9.9" }, atoms: [validAtom] })
        .success,
    ).toBe(false);
  });

  it("applies pack defaults and merges contraindications", () => {
    const parsed = moduleFileSchema.parse({
      meta: { ...validMeta, defaults: { vertical: "smoking", contraindications: ["pack-flag"] } },
      atoms: [{ ...validAtom, contraindications: ["atom-flag"] }],
    });
    const [resolved] = resolveAtoms(parsed);
    expect(resolved?.readingAge).toBe(9);
    expect(resolved?.tone).toBe("autonomy-supportive");
    expect(resolved?.channels).toEqual(["app", "web"]);
    expect(resolved?.contraindications).toEqual(["pack-flag", "atom-flag"]);
    expect(resolved?.vertical).toBe("smoking");
  });
});
