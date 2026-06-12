import { z } from "zod";
import { VERTICALS } from "@preventos/domain";

export const ATOM_TYPES = [
  "message",
  "info_card",
  "exercise",
  "audio_script",
  "plan_template",
  "push",
  "education",
] as const;
export type AtomType = (typeof ATOM_TYPES)[number];

export const COM_B_SUBTYPES = [
  "physical-capability",
  "psychological-capability",
  "physical-opportunity",
  "social-opportunity",
  "reflective-motivation",
  "automatic-motivation",
] as const;
export type ComBSubtype = (typeof COM_B_SUBTYPES)[number];

export const TONES = ["autonomy-supportive", "practical", "warm-challenge"] as const;
export type Tone = (typeof TONES)[number];

export const CONTENT_CHANNELS = ["app", "web", "push", "email", "audio"] as const;
export type ContentChannel = (typeof CONTENT_CHANNELS)[number];

export const ATOM_STATUSES = ["draft", "approved", "locked"] as const;
export type AtomStatus = (typeof ATOM_STATUSES)[number];

const STATUS_ALIASES: Readonly<Record<string, AtomStatus>> = {
  draft: "draft",
  "draft-pending-clinical-sign-off": "draft",
  approved: "approved",
  "clinically-approved": "approved",
  locked: "locked",
};

export const statusSchema = z.string().transform((value, ctx): AtomStatus => {
  const status = STATUS_ALIASES[value];
  if (status === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `unknown status "${value}" (expected one of: ${Object.keys(STATUS_ALIASES).join(", ")})`,
    });
    return z.NEVER;
  }
  return status;
});

const ATOM_ID = /^[a-z0-9]+(\.[a-z0-9][a-z0-9-]*)+$/;
const BCT_CODE = /^\d{1,2}\.\d{1,2}$/;
const SLOT_NAME = /^[a-z0-9_]+$/;

export const bctTagSchema = z.object({
  code: z.string().regex(BCT_CODE, "BCTTv1 codes look like '1.2' or '13.5'"),
  label: z.string().min(1),
});

export const rawAtomSchema = z
  .object({
    id: z.string().regex(ATOM_ID, "atom ids are dot-namespaced kebab-case, e.g. smoking.lapse.opener"),
    type: z.enum(ATOM_TYPES),
    title: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    steps: z.array(z.string().min(1)).min(1).optional(),
    channel_variants: z.record(z.enum(CONTENT_CHANNELS), z.string().min(1)).optional(),
    slots: z.array(z.string().regex(SLOT_NAME)).optional(),
    bcttv1: z.array(bctTagSchema).min(1, "every atom must carry at least one BCTTv1 tag"),
    com_b: z.array(z.enum(COM_B_SUBTYPES)).min(1, "every atom must declare at least one COM-B target"),
    reading_age: z.number().int().min(5).max(16).optional(),
    tone: z.enum(TONES).optional(),
    channels: z.array(z.enum(CONTENT_CHANNELS)).min(1).optional(),
    contraindications: z.array(z.string().min(1)).optional(),
    evidence_note: z.string().optional(),
  })
  .superRefine((atom, ctx) => {
    if (atom.body === undefined && atom.steps === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "atom needs a body or steps" });
    }
    const declared = new Set(atom.slots ?? []);
    const texts = [atom.body ?? "", ...(atom.steps ?? []), ...Object.values(atom.channel_variants ?? {})];
    for (const text of texts) {
      for (const match of text.matchAll(/\{([a-z0-9_]+)\}/g)) {
        if (!declared.has(match[1]!)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `placeholder {${match[1]}} is not declared in slots`,
          });
        }
      }
    }
  });
export type RawAtom = z.infer<typeof rawAtomSchema>;

export const packDefaultsSchema = z.object({
  reading_age: z.number().int().min(5).max(16).default(9),
  tone: z.enum(TONES).default("autonomy-supportive"),
  channels: z.array(z.enum(CONTENT_CHANNELS)).min(1).default(["app", "web"]),
  vertical: z.enum(VERTICALS),
  contraindications: z.array(z.string()).default([]),
});

export const moduleMetaSchema = z.object({
  pack: z.string().min(1),
  programme: z.string().optional(),
  module: z.string().min(1),
  status: statusSchema,
  schema: z
    .string()
    .refine((s) => s.startsWith("preventos.content-atom/0.1"), "unsupported content schema version"),
  language: z.string().default("en-GB"),
  sources: z.array(z.string()).default([]),
  defaults: packDefaultsSchema,
});

export const sequenceSchema = z.object({
  id: z.string().regex(ATOM_ID),
  steps: z
    .array(z.object({ atom: z.string().regex(ATOM_ID), delay_hours: z.number().min(0).optional() }))
    .min(1),
});
export type Sequence = z.infer<typeof sequenceSchema>;

export const moduleFileSchema = z.object({
  meta: moduleMetaSchema,
  atoms: z.array(rawAtomSchema).min(1),
  sequences: z.array(sequenceSchema).optional(),
});
export type ModuleFile = z.infer<typeof moduleFileSchema>;

/** An atom with pack defaults applied and provenance attached — the unit the platform serves. */
export interface ResolvedAtom {
  readonly id: string;
  readonly type: AtomType;
  readonly title?: string;
  readonly body?: string;
  readonly steps?: readonly string[];
  readonly channelVariants: Readonly<Partial<Record<ContentChannel, string>>>;
  readonly slots: readonly string[];
  readonly bct: readonly { code: string; label: string }[];
  readonly comB: readonly ComBSubtype[];
  readonly readingAge: number;
  readonly tone: Tone;
  readonly channels: readonly ContentChannel[];
  readonly vertical: (typeof VERTICALS)[number];
  readonly contraindications: readonly string[];
  readonly status: AtomStatus;
  readonly language: string;
  readonly pack: string;
  readonly module: string;
  readonly evidenceNote?: string;
}

export function resolveAtoms(file: ModuleFile): readonly ResolvedAtom[] {
  const { meta } = file;
  // An authored channel variant is intent to serve that channel: channels are
  // the union of the declared list (or pack defaults) and variant keys.
  const channelsFor = (atom: RawAtom): readonly ContentChannel[] => [
    ...new Set([
      ...(atom.channels ?? meta.defaults.channels),
      ...(Object.keys(atom.channel_variants ?? {}) as ContentChannel[]),
    ]),
  ];
  return file.atoms.map((atom) => ({
    id: atom.id,
    type: atom.type,
    ...(atom.title !== undefined ? { title: atom.title } : {}),
    ...(atom.body !== undefined ? { body: atom.body } : {}),
    ...(atom.steps !== undefined ? { steps: atom.steps } : {}),
    channelVariants: atom.channel_variants ?? {},
    slots: atom.slots ?? [],
    bct: atom.bcttv1,
    comB: atom.com_b,
    readingAge: atom.reading_age ?? meta.defaults.reading_age,
    tone: atom.tone ?? meta.defaults.tone,
    channels: channelsFor(atom),
    vertical: meta.defaults.vertical,
    contraindications: [...meta.defaults.contraindications, ...(atom.contraindications ?? [])],
    status: meta.status,
    language: meta.language,
    pack: meta.pack,
    module: meta.module,
    ...(atom.evidence_note !== undefined ? { evidenceNote: atom.evidence_note } : {}),
  }));
}
