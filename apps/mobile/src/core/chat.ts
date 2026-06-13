/**
 * Coach chat state + the deterministic pre-LLM crisis gate.
 *
 * Safety invariant 1: risk detection is deterministic, runs BEFORE any LLM path,
 * and cannot be bypassed. The gate delegates to the ONE 843-case-validated
 * classifier from @preventos/safety — imported through its pure, db-free entry
 * (`@preventos/safety/classify`) so it bundles into the app — the same engine the
 * server runs (W3-SAFEPORT). It replaces the previous hand-rolled 11-pattern
 * list, which both missed obfuscated phrasings ("k i l l m y s e l f", "kms",
 * "unalive") and lacked the classifier's idiom guards. `classifyOutbound` takes
 * only the text: no config, flag, or option can disable it. The reducer routes
 * any detected risk to the scripted crisis flow without ever creating a coach
 * request, and the bundled pure classifier guarantees this works fully offline.
 */
import { classify } from "@preventos/safety/classify";
import type { RiskAssessment } from "@preventos/safety/classify";

/** The validated classifier's verdict on one outbound message. */
export const classifyOutbound = (text: string): RiskAssessment => classify(text);

/**
 * Both tier 1 (immediate) and tier 2 (elevated) route away from the coach to the
 * scripted crisis flow: on the client the safe handling for either is the static
 * resources screen, never the LLM. The gate is binary at the routing boundary
 * even though the underlying classifier is tiered.
 */
export const routesToCrisis = (text: string): boolean => classify(text).tier >= 1;

export interface ChatMessage {
  readonly id: string;
  readonly role: "user" | "coach";
  readonly text: string;
  readonly streaming: boolean;
}

export interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly pendingCoachRequest: string | null;
  readonly crisisActive: boolean;
}

export type ChatAction =
  | { type: "send"; text: string }
  | { type: "stream_token"; token: string }
  | { type: "stream_end" }
  | { type: "crisis_dismissed" };

export const emptyChat = (): ChatState => ({
  messages: [],
  pendingCoachRequest: null,
  crisisActive: false,
});

let counter = 0;
const nextId = (): string => `msg-${++counter}`;

export const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "send": {
      // Crisis gate runs first, unconditionally. Detected risk never becomes a coach request.
      if (routesToCrisis(action.text)) {
        return { ...state, pendingCoachRequest: null, crisisActive: true };
      }
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: nextId(), role: "user", text: action.text, streaming: false },
        ],
        pendingCoachRequest: action.text,
      };
    }
    case "stream_token": {
      const last = state.messages.at(-1);
      if (last?.role === "coach" && last.streaming) {
        return {
          ...state,
          messages: [
            ...state.messages.slice(0, -1),
            { ...last, text: last.text + action.token },
          ],
        };
      }
      return {
        ...state,
        pendingCoachRequest: null,
        messages: [
          ...state.messages,
          { id: nextId(), role: "coach", text: action.token, streaming: true },
        ],
      };
    }
    case "stream_end": {
      const last = state.messages.at(-1);
      if (last?.role !== "coach" || !last.streaming) return state;
      return {
        ...state,
        messages: [...state.messages.slice(0, -1), { ...last, streaming: false }],
      };
    }
    case "crisis_dismissed":
      return { ...state, crisisActive: false };
  }
};
