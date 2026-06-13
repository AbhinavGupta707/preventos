import type { BfoSection, ReadinessStage, Vertical } from "@preventos/domain";
import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import { HSI, scoreInstrument } from "@preventos/instruments";

export interface IntakeAnswers {
  readonly hsi: Readonly<Record<string, number>>;
  readonly triggers: readonly string[];
  readonly struggles: readonly string[];
  readonly readiness?: ReadinessStage;
  readonly quitOffsetDays?: number;
  readonly cigarettesPerDay?: number;
  readonly pricePerPack?: number;
  readonly weeklySpend?: number;
}

export interface IntakeState {
  readonly vertical: Vertical;
  readonly answers: IntakeAnswers;
}

export type IntakeAction =
  | { type: "answer_hsi"; item: string; value: number }
  | { type: "toggle_trigger"; trigger: string }
  | { type: "toggle_struggle"; struggle: string }
  | { type: "set_readiness"; readiness: ReadinessStage }
  | { type: "set_quit_offset"; days: number }
  | { type: "set_spend"; cigarettesPerDay?: number; pricePerPack?: number; weeklySpend?: number };

export const emptyIntake = (vertical: Vertical): IntakeState => ({
  vertical,
  answers: { hsi: {}, triggers: [], struggles: [] },
});

const toggle = (list: readonly string[], item: string): readonly string[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export const intakeReducer = (state: IntakeState, action: IntakeAction): IntakeState => {
  const a = state.answers;
  switch (action.type) {
    case "answer_hsi":
      return { ...state, answers: { ...a, hsi: { ...a.hsi, [action.item]: action.value } } };
    case "toggle_trigger":
      return { ...state, answers: { ...a, triggers: toggle(a.triggers, action.trigger) } };
    case "toggle_struggle":
      return { ...state, answers: { ...a, struggles: toggle(a.struggles, action.struggle) } };
    case "set_readiness":
      return { ...state, answers: { ...a, readiness: action.readiness } };
    case "set_quit_offset":
      return { ...state, answers: { ...a, quitOffsetDays: action.days } };
    case "set_spend":
      return {
        ...state,
        answers: {
          ...a,
          cigarettesPerDay: action.cigarettesPerDay ?? a.cigarettesPerDay,
          pricePerPack: action.pricePerPack ?? a.pricePerPack,
          weeklySpend: action.weeklySpend ?? a.weeklySpend,
        },
      };
  }
};

/** Screen count per vertical — the ≤90s budget is enforced as ≤8 single-tap steps. */
const STEP_COUNTS: Readonly<Record<Vertical, number>> = {
  smoking: 7, // welcome, HSI×2, triggers, readiness, quit date, spend
  vaping: 6,
  alcohol: 8,
  sleep: 5,
};

export const intakeStepCount = (vertical: Vertical): number => STEP_COUNTS[vertical];

/**
 * Maps self-reported struggles to COM-B deficits (PRD §3.1). Deterministic,
 * conservative: unmapped struggles land in motivation.
 */
const COMB_MAP: Readonly<Record<string, "capability" | "opportunity" | "motivation">> = {
  "cravings hit out of nowhere": "capability",
  "i don't know what to do instead": "capability",
  "everyone around me smokes": "opportunity",
  "my routines are built around it": "opportunity",
  "i'm not sure i really want to stop": "motivation",
  "i've failed before and it gets to me": "motivation",
};

const REQUIRED_HSI_ITEMS = ["hsi-ttfc", "hsi-cpd"] as const;

export const toBfoSection = (state: IntakeState): Result<BfoSection, string> => {
  const a = state.answers;
  const instrumentScores: Record<string, number> = {};

  if (state.vertical === "smoking") {
    if (REQUIRED_HSI_ITEMS.some((item) => a.hsi[item] === undefined)) {
      return err("HSI incomplete — instrument scores are never guessed");
    }
    // Map mobile's internal answer keys to canonical instrument item ids and
    // score against the single source of truth (@preventos/instruments).
    const hsi = scoreInstrument(HSI, {
      ttfc: a.hsi["hsi-ttfc"]!,
      cpd: a.hsi["hsi-cpd"]!,
    });
    if (!hsi.ok) return err(hsi.error);
    instrumentScores["hsi"] = hsi.value.total;
  }

  if (a.readiness === undefined) return err("readiness stage not answered");

  const comB = { capability: [] as string[], opportunity: [] as string[], motivation: [] as string[] };
  for (const struggle of a.struggles) {
    comB[COMB_MAP[struggle.toLowerCase()] ?? "motivation"].push(struggle);
  }

  const expected = ["hsi", "triggers", "readiness", "spend"] as const;
  const answered = [
    Object.keys(a.hsi).length >= REQUIRED_HSI_ITEMS.length || state.vertical !== "smoking",
    a.triggers.length > 0,
    a.readiness !== undefined,
    a.cigarettesPerDay !== undefined || a.weeklySpend !== undefined,
  ].filter(Boolean).length;

  return ok({
    vertical: state.vertical,
    readiness: a.readiness,
    comB: {
      capability: [...comB.capability],
      opportunity: [...comB.opportunity],
      motivation: [...comB.motivation],
    },
    triggers: [...a.triggers],
    instrumentScores,
    completeness: answered / expected.length,
  });
};
