import { createHash } from "node:crypto";
import { z } from "zod";

/**
 * Experiment framework lite (plan WP8.4). Safety is excluded from
 * experimentation BY CONSTRUCTION, two ways:
 *   1. The surface vocabulary below is the only place experiments can attach,
 *      and it contains no safety, crisis, escalation or risk surface — there
 *      is no value an experiment author could pass to reach those flows.
 *   2. Experiment keys in reserved safety namespaces are rejected at parse
 *      time, so a "safety.*" experiment cannot even be defined.
 * Every experiment must monitor the escalation-rate guardrail.
 */

export const EXPERIMENT_SURFACES = [
  "content_variant",
  "notification_copy",
  "onboarding_flow",
  "dashboard_module",
] as const;
export type ExperimentSurface = (typeof EXPERIMENT_SURFACES)[number];

export const GUARDRAIL_METRICS = [
  "escalations.opened.per_1k",
  "retention.d7",
  "retention.d30",
  "contact.optout.rate",
] as const;
export type GuardrailMetric = (typeof GUARDRAIL_METRICS)[number];

export const MANDATORY_GUARDRAIL: GuardrailMetric = "escalations.opened.per_1k";

const RESERVED_NAMESPACES = ["safety", "crisis", "escalation", "risk", "consent"] as const;

export const experimentSchema = z
  .object({
    key: z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/),
    version: z.number().int().positive(),
    surface: z.enum(EXPERIMENT_SURFACES),
    variants: z
      .array(z.object({ name: z.string().min(1), weight: z.number().positive() }).strict())
      .min(2),
    guardrails: z.array(z.enum(GUARDRAIL_METRICS)).min(1),
  })
  .strict()
  .superRefine((exp, ctx) => {
    const namespace = exp.key.split(".")[0];
    if (namespace !== undefined && (RESERVED_NAMESPACES as readonly string[]).includes(namespace)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["key"],
        message: `namespace "${namespace}" is reserved — safety flows are not experimentable`,
      });
    }
    if (!exp.guardrails.includes(MANDATORY_GUARDRAIL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guardrails"],
        message: `every experiment must monitor ${MANDATORY_GUARDRAIL}`,
      });
    }
    if (new Set(exp.variants.map((v) => v.name)).size !== exp.variants.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "variant names must be unique",
      });
    }
  });

export type Experiment = z.infer<typeof experimentSchema>;

export function parseExperiment(input: unknown): Experiment {
  return experimentSchema.parse(input);
}

/**
 * Deterministic assignment: sha256(key@version:personId) → [0,1) →
 * weight-proportional bucket. No state, no randomness — the same person
 * always lands in the same variant for a given experiment version.
 */
export function assignVariant(experiment: Experiment, personId: string): string {
  const digest = createHash("sha256")
    .update(`${experiment.key}@${experiment.version}:${personId}`)
    .digest();
  const r = digest.readUInt32BE(0) / 0x1_0000_0000;
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight / totalWeight;
    if (r < cumulative) return variant.name;
  }
  return experiment.variants[experiment.variants.length - 1]?.name ?? "";
}
