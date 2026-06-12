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

describe("WP4.2m type vocabulary", () => {
  it("microcopy needs no BCT/COM-B tags (UI strings are not interventions)", () => {
    const atom = { id: "alcohol.diary.quicklog-title", type: "microcopy", body: "What did you have?" };
    expect(rawAtomSchema.safeParse(atom).success).toBe(true);
  });

  it("rejects unknown atom fields (the schema is strict — fields earn a place or don't exist)", () => {
    expect(rawAtomSchema.safeParse({ ...validAtom, surface: "diary.quicklog" }).success).toBe(false);
    expect(
      moduleFileSchema.safeParse({ meta: validMeta, atoms: [validAtom], ladders: [] }).success,
    ).toBe(false);
    expect(
      moduleFileSchema.safeParse({ meta: validMeta, atoms: [validAtom], data: { ladders: [] } }).success,
    ).toBe(true);
  });

  it("non-microcopy types still require BCT and COM-B tags", () => {
    const atom = { id: "smoking.test.a", type: "message", body: "Hi" };
    expect(rawAtomSchema.safeParse(atom).success).toBe(false);
  });

  it("menu carries items and needs no body", () => {
    const menu = {
      id: "vaping.bored.desk",
      type: "menu",
      title: "Desk / working",
      items: [{ copy: "Fidget object in the vape pocket", fills: "hands" }],
      bcttv1: [{ code: "8.2", label: "Behaviour substitution" }],
      com_b: ["automatic-motivation"],
    };
    expect(rawAtomSchema.safeParse(menu).success).toBe(true);
    expect(rawAtomSchema.safeParse({ ...menu, items: [] }).success).toBe(false);
    expect(rawAtomSchema.safeParse({ ...menu, items: undefined }).success).toBe(false);
  });

  it("jitai_message requires a trigger_window", () => {
    const jitai = {
      id: "smoking.jitai.morning-1",
      type: "jitai_message",
      body: "Patch on, plan ready?",
      trigger_window: "morning",
      variant_group: "morning",
      bcttv1: [{ code: "7.1", label: "Prompts/cues" }],
      com_b: ["automatic-motivation"],
    };
    expect(rawAtomSchema.safeParse(jitai).success).toBe(true);
    expect(rawAtomSchema.safeParse({ ...jitai, trigger_window: undefined }).success).toBe(false);
  });

  it("outcome_prompt requires outcome_ref and options", () => {
    const prompt = {
      id: "smoking.outcomes.check-7-day",
      type: "outcome_prompt",
      body: "Have you smoked at all?",
      outcome_ref: "smoking.point-prevalence.7-day",
      options: ["No", "Yes"],
      bcttv1: [{ code: "2.2", label: "Feedback on behaviour" }],
      com_b: ["reflective-motivation"],
    };
    expect(rawAtomSchema.safeParse(prompt).success).toBe(true);
    expect(rawAtomSchema.safeParse({ ...prompt, options: undefined }).success).toBe(false);
    expect(rawAtomSchema.safeParse({ ...prompt, outcome_ref: undefined }).success).toBe(false);
  });

  it("screen_script carries structured questions with flaggable options", () => {
    const screen = {
      id: "sleep.safety.occupation-screen",
      type: "screen_script",
      questions: [
        {
          key: "q1",
          prompt: "Does your work involve any of these?",
          options: [{ id: "driving-professional", label: "Driving as the job", flag: true }],
        },
      ],
      bcttv1: [{ code: "4.1", label: "Instruction on how to perform the behaviour" }],
      com_b: ["psychological-capability"],
    };
    expect(rawAtomSchema.safeParse(screen).success).toBe(true);
    expect(rawAtomSchema.safeParse({ ...screen, questions: [] }).success).toBe(false);
  });

  it("scans items, questions, and tone_variants for undeclared placeholders", () => {
    const base = {
      id: "smoking.test.slots",
      type: "menu",
      bcttv1: [{ code: "8.2", label: "Behaviour substitution" }],
      com_b: ["automatic-motivation"],
    };
    expect(
      rawAtomSchema.safeParse({ ...base, items: [{ copy: "You saved {amount}" }] }).success,
    ).toBe(false);
    expect(
      rawAtomSchema.safeParse({ ...base, slots: ["amount"], items: [{ copy: "You saved {amount}" }] }).success,
    ).toBe(true);
    expect(
      rawAtomSchema.safeParse({
        ...base,
        type: "message",
        body: "ok",
        tone_variants: { "warm-challenge": "Be honest: {count}" },
      }).success,
    ).toBe(false);
  });

  it("resolveAtoms carries the new fields through", () => {
    const parsed = moduleFileSchema.parse({
      meta: validMeta,
      atoms: [
        {
          id: "smoking.jitai.morning-1",
          type: "jitai_message",
          body: "Patch on.",
          trigger_window: "morning",
          variant_group: "morning",
          tone_variants: { practical: "Patch on now." },
          bcttv1: [{ code: "7.1", label: "Prompts/cues" }],
          com_b: ["automatic-motivation"],
        },
      ],
    });
    const [resolved] = resolveAtoms(parsed);
    expect(resolved?.triggerWindow).toBe("morning");
    expect(resolved?.variantGroup).toBe("morning");
    expect(resolved?.toneVariants).toEqual({ practical: "Patch on now." });
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
