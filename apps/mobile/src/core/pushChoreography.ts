/**
 * Push permission choreography (WP2.5): an in-app primer always precedes the
 * OS prompt, because the OS prompt is a one-shot on iOS. Declining the primer
 * defers (we may re-prime at a milestone); an OS denial is terminal for
 * prompting — only the user via system settings can change it.
 */

export type ChoreographyStage = "not_asked" | "primed" | "deferred" | "granted" | "denied";

export interface ChoreographyState {
  readonly stage: ChoreographyStage;
}

export type ChoreographyEvent = "primer_accepted" | "primer_declined" | "os_granted" | "os_denied";

export const initialChoreography: ChoreographyState = { stage: "not_asked" };

export const choreographyReducer = (
  state: ChoreographyState,
  event: ChoreographyEvent,
): ChoreographyState => {
  if (state.stage === "granted" || state.stage === "denied") return state;
  switch (event) {
    case "primer_accepted":
      return { stage: "primed" };
    case "primer_declined":
      return { stage: "deferred" };
    case "os_granted":
      return state.stage === "primed" ? { stage: "granted" } : state;
    case "os_denied":
      return state.stage === "primed" ? { stage: "denied" } : state;
  }
};

/** The OS prompt may fire only from the primed stage. */
export const canPromptOs = (state: ChoreographyState): boolean => state.stage === "primed";
