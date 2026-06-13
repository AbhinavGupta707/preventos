export { runCoachTurn } from "./pipeline.js";
export type { CoachDeps, CoachLogEntry, CoachLogSink } from "./pipeline.js";
export { buildFrame } from "./frames.js";
export { postFilter } from "./fences.js";
export type { FenceVerdict } from "./fences.js";
export { FakeCoachProvider } from "./providers/fake.js";
export type { FakeResponder } from "./providers/fake.js";
export { ClaudeCoachProvider, claudeProviderFromEnv } from "./providers/claude.js";
export type { ClaudeProviderOptions } from "./providers/claude.js";
export { FireworksCoachProvider, fireworksProviderFromEnv } from "./providers/fireworks.js";
export type { FireworksProviderOptions, FetchLike } from "./providers/fireworks.js";
export { SAFE_FALLBACK, safeSubstitute } from "./messages.js";
export type { CoachLlmProvider, LlmRequest, LlmResponse, LlmTurn } from "./provider.js";
export { COACH_FRAMES } from "./types.js";
export { runMiEval } from "./eval/runner.js";
export type { MiEvalDeps, MiEvalReport, MiCaseResult, MiRate } from "./eval/runner.js";
export { scoreMiAdherence } from "./eval/mi-rubric.js";
export type { MiScore, MiDimensions } from "./eval/mi-rubric.js";
export { MI_CORPUS, NON_ADHERENT_CONTROLS, corpusResponder } from "./eval/corpora.js";
export type { MiCase } from "./eval/corpora.js";
export type {
  CoachContext,
  CoachDisposition,
  CoachFrame,
  CoachHistoryTurn,
  CoachInput,
  CoachReply,
  CoachTurn,
} from "./types.js";
