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

/** High-signal tier-1 phrases. The full corpus-driven classifier is WS7; this client gate is additive, never replaced by config. */
const TIER1_PATTERNS: readonly RegExp[] = [
  /\bsuicid/i,
  /\bkill (?:myself|me)\b/i,
  /\bend(?:ing)? my life\b/i,
  /\bwant(?:ed)? to die\b/i,
  /\bbetter off dead\b/i,
  /\bself[- ]?harm/i,
  /\bhurt(?:ing)? myself\b/i,
  /\bend it all\b/i,
  /\bdon'?t want to (?:live|be here|wake up)\b/i,
  /\boverdos/i,
  /\bno reason to (?:live|go on)\b/i,
];

export type RiskTier = "none" | "tier1";

export const classifyOutbound = (text: string): RiskTier =>
  TIER1_PATTERNS.some((p) => p.test(text)) ? "tier1" : "none";

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
    case "crisis_dismissed":
      return { ...state, crisisActive: false };
  }
};
