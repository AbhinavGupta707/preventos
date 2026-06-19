/**
 * Coach chat state + the deterministic pre-LLM crisis gate.
 *
 * Safety invariant 1: tier-1 risk detection is deterministic, runs BEFORE any
 * LLM path, and cannot be bypassed. `classifyOutbound` takes only the text —
 * there is no config, flag, or option that can disable it — and the reducer
 * routes tier-1 messages to the scripted crisis flow without ever creating a
 * coach request. The server applies its own gate when SVC lands; this client
 * gate guarantees the crisis flow renders even fully offline.
 */
import { classify } from "@preventos/safety-core";

export type RiskTier = "none" | "tier1";

/**
 * Delegates to the 843-case-validated classifier in @preventos/safety-core
 * (W3-SAFEPORT) so the mobile client and the server proxy share ONE validated
 * classifier — no local pattern list to drift. Tier 1 and tier 2 both route to
 * the scripted crisis flow and never become a coach request. Takes only the
 * text: no config, no bypass (invariant 1).
 */
export const classifyOutbound = (text: string): RiskTier =>
  classify(text).tier === 0 ? "none" : "tier1";

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
  | { type: "server_crisis" }
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
      // Crisis gate runs first, unconditionally. Tier-1 never becomes a coach request.
      if (classifyOutbound(action.text) === "tier1") {
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
    case "server_crisis": {
      const last = state.messages.at(-1);
      const messages =
        last?.role === "user" && last.text === state.pendingCoachRequest
          ? state.messages.slice(0, -1)
          : state.messages;
      return { ...state, messages, pendingCoachRequest: null, crisisActive: true };
    }
    case "crisis_dismissed":
      return { ...state, crisisActive: false };
  }
};
