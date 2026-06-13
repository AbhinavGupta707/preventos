import type { Vertical } from "@preventos/domain";
import type { FakeResponder } from "../providers/fake.js";
import type { CoachFrame } from "../types.js";

/**
 * WP6.2 — per-vertical synthetic MI corpora.
 *
 * Each case is a tier-0 (safe) user message paired with the coach reply the Fake
 * provider returns for it. The replies are the *target* behaviour: brief,
 * reflective, affirming, at most one open question, never lecturing or shaming —
 * the MI spirit the rubric scores. Two cases (`smk-track`, `vap-restart`) carry
 * deliberately sub-par replies (a righting-reflex lecture and question-stacking)
 * so the eval measures a real adherence RATE and proves the ≥90% gate is a floor,
 * not an all-pass. The clearly non-MI `NON_ADHERENT_CONTROLS` calibrate the other
 * end: the rubric must score them 0%.
 *
 * No case message trips the safety classifier (all tier-0) and no reply trips the
 * claims register (no treatment/efficacy/dosing/detox language), so every turn
 * runs the full pre→LLM→post pipeline cleanly with the deterministic Fake
 * provider — zero spend, no key.
 */
export interface MiCase {
  readonly id: string;
  readonly vertical: Vertical;
  readonly frame: CoachFrame;
  readonly userText: string;
  readonly reply: string;
  /** True for the intentionally sub-par replies (in-corpus slips). */
  readonly subPar?: boolean;
}

export const MI_CORPUS: readonly MiCase[] = [
  // --- smoking ---
  {
    id: "smk-meeting",
    vertical: "smoking",
    frame: "general",
    userText: "I made it through a really stressful meeting without stepping out for a smoke.",
    reply:
      "That's real strength — holding steady through a stressful meeting is exactly the kind of moment that counts. What helped you ride it out?",
  },
  {
    id: "smk-urge",
    vertical: "smoking",
    frame: "craving_rescue",
    userText: "The urge hit hard after lunch and I nearly gave in.",
    reply:
      "Sounds like that after-lunch urge really tested you, and you stayed with it. Cravings crest and pass — what could you reach for when the next wave builds?",
  },
  {
    id: "smk-five",
    vertical: "smoking",
    frame: "taper_check_in",
    userText: "I cut down to about five a day this week but it's tough in the evenings.",
    reply:
      "Down to five a day is genuine progress, and it makes sense the evenings are the hardest stretch. What tends to set off the evening ones?",
  },
  {
    id: "smk-pub",
    vertical: "smoking",
    frame: "general",
    userText: "I caved and had one at the pub last night.",
    reply:
      "One at the pub doesn't erase the progress you've made — it's just information. What was going on for you right before?",
  },
  {
    id: "smk-ambivalent",
    vertical: "smoking",
    frame: "general",
    userText: "Honestly I'm not sure I even want to quit anymore.",
    reply:
      "It sounds like part of you is weighing whether quitting is still right, and that's an honest place to be. This is your call — what matters most to you about it either way?",
  },
  {
    id: "smk-coffee",
    vertical: "smoking",
    frame: "craving_rescue",
    userText: "Mornings with coffee are the hardest.",
    reply:
      "Coffee and a cigarette are tightly linked habits, so it makes sense mornings bite hardest. What's one small swap you could try with tomorrow's cup?",
  },
  {
    id: "smk-track",
    vertical: "smoking",
    frame: "taper_check_in",
    userText: "I keep forgetting to track my cigarettes.",
    subPar: true,
    // Sub-par: the righting reflex — commanding and arguing the person into change.
    reply:
      "You should just track every single one — you have to be disciplined about it. Why didn't you set a reminder yesterday?",
  },

  // --- vaping ---
  {
    id: "vap-threedays",
    vertical: "vaping",
    frame: "general",
    userText: "Three days without my vape and I keep reaching for my pocket.",
    reply:
      "Three days in and your hand still remembers the habit — that's so normal this early. What's helped you pause when you reach for it?",
  },
  {
    id: "vap-waves",
    vertical: "vaping",
    frame: "craving_rescue",
    userText: "The cravings come in waves and I feel restless.",
    reply:
      "It sounds like the restlessness rolls in alongside the cravings. One wave at a time is plenty — what helps you settle when the next one rises?",
  },
  {
    id: "vap-foggy",
    vertical: "vaping",
    frame: "taper_check_in",
    userText: "I dropped my nicotine level and feel a bit foggy.",
    reply:
      "Feeling foggy as your body adjusts makes sense, and going at your own pace is exactly right. What's felt manageable so far this week?",
  },
  {
    id: "vap-party",
    vertical: "vaping",
    frame: "general",
    userText: "I vaped at a party even though I told myself I wouldn't.",
    reply:
      "Vaping at the party when you'd hoped not to is worth being kind to yourself about — slips are part of the road. What do you make of what led up to it?",
  },
  {
    id: "vap-gum",
    vertical: "vaping",
    frame: "general",
    userText: "I'm proud I swapped my vape for gum today.",
    reply:
      "Swapping the vape for gum today is a genuine win — that took real intention. What made that swap easier to reach for?",
  },
  {
    id: "vap-stress",
    vertical: "vaping",
    frame: "craving_rescue",
    userText: "Stress at work makes me want to vape constantly.",
    reply:
      "It sounds like work stress and the urge to vape are tightly wound together right now. What's one thing that takes the edge off when the pressure spikes?",
  },
  {
    id: "vap-restart",
    vertical: "vaping",
    frame: "general",
    userText: "I don't know why I started again.",
    subPar: true,
    // Sub-par: question-stacking — interrogating rather than reflecting.
    reply: "Tell me exactly what happened. What time was it? Where were you, and who were you with?",
  },

  // --- alcohol ---
  {
    id: "alc-overdid",
    vertical: "alcohol",
    frame: "drink_diary_debrief",
    userText: "I had way more than I planned at dinner last night.",
    reply:
      "A heavier night than you planned is a data point, not a failure — thank you for logging it honestly. What do you notice about what the evening was giving you?",
  },
  {
    id: "alc-threefree",
    vertical: "alcohol",
    frame: "general",
    userText: "I managed three alcohol-free days this week.",
    reply:
      "Three alcohol-free days this week is something to be proud of — that takes real commitment. What helped you protect those days?",
  },
  {
    id: "alc-embarrassed",
    vertical: "alcohol",
    frame: "drink_diary_debrief",
    userText: "I only logged half my drinks because I was embarrassed.",
    reply:
      "It makes sense you'd feel embarrassed, and logging even half took honesty. There's no judgement here — what would make it feel safer to log the rest?",
  },
  {
    id: "alc-fridays",
    vertical: "alcohol",
    frame: "general",
    userText: "Fridays are my weak spot, I always overdo it.",
    reply:
      "It sounds like Fridays carry a particular pull after the week. What's usually happening on a Friday that tips it over?",
  },
  {
    id: "alc-unwind",
    vertical: "alcohol",
    frame: "drink_diary_debrief",
    userText: "I drank to unwind after a horrible day.",
    reply:
      "Reaching for a drink to unwind after a horrible day was doing a real job for you. What else helps you decompress when a day's been brutal?",
  },
  {
    id: "alc-friends",
    vertical: "alcohol",
    frame: "general",
    userText: "I want to cut back but my friends all drink a lot.",
    reply:
      "It sounds like you genuinely want to cut back and your social world makes that complicated — both true at once. It's your call — what feels like a realistic first step with friends?",
  },
  {
    id: "alc-firstday",
    vertical: "alcohol",
    frame: "drink_diary_debrief",
    userText: "I didn't drink at all yesterday for the first time in ages.",
    reply:
      "First fully alcohol-free day in ages — that's not nothing, and you did it. What was different about yesterday that made it possible?",
  },

  // --- sleep (wellbeing language only; no treatment claims) ---
  {
    id: "slp-awake",
    vertical: "sleep",
    frame: "sleep_window_explainer",
    userText: "I lay awake for two hours again last night.",
    reply:
      "Two hours awake again sounds draining and frustrating. Steady mornings and a calm wind-down give the nights their best chance — what's your wind-down looking like lately?",
  },
  {
    id: "slp-steady",
    vertical: "sleep",
    frame: "general",
    userText: "I kept my wake-up time steady all week like we talked about.",
    reply:
      "Keeping your wake-up time steady all week is a real anchor for your body clock — well done sticking with it. How did the steady mornings feel?",
  },
  {
    id: "slp-scared",
    vertical: "sleep",
    frame: "sleep_window_explainer",
    userText: "I'm worried about going to bed because I know I won't sleep.",
    reply:
      "It sounds like bedtime has started to feel loaded with worry about not sleeping. That's such a common loop — what's one gentle thing that helps you feel calmer heading to bed?",
  },
  {
    id: "slp-phone",
    vertical: "sleep",
    frame: "general",
    userText: "I scrolled on my phone in bed for ages last night.",
    reply:
      "Scrolling your phone in bed is so easy to slip into — no judgement at all. What could sit by the bed to reach for instead next time?",
  },
  {
    id: "slp-variable",
    vertical: "sleep",
    frame: "sleep_window_explainer",
    userText: "Some nights are better than others and it's confusing.",
    reply:
      "It makes sense the up-and-down nights feel confusing — sleep is rarely a straight line. What do you notice on the better nights?",
  },
  {
    id: "slp-gotup",
    vertical: "sleep",
    frame: "general",
    userText: "I got up and read when I couldn't sleep instead of tossing.",
    reply:
      "Getting up to read instead of tossing and turning is exactly the kind of move that helps — that took some doing in the moment. What made it easier to get up?",
  },
  {
    id: "slp-racing",
    vertical: "sleep",
    frame: "sleep_window_explainer",
    userText: "I feel exhausted but my mind won't switch off.",
    reply:
      "Feeling wiped while your mind keeps racing is a horrible mix — you're carrying a lot. What helps your thoughts start to slow as the evening winds down?",
  },
];

/** Clearly non-MI replies — the rubric MUST score every one of these as non-adherent. */
export const NON_ADHERENT_CONTROLS: readonly { readonly id: string; readonly reply: string }[] = [
  { id: "lecture", reply: "You should just stop. You have to try harder — obviously you're not committed enough." },
  { id: "shame", reply: "That's a real failure. You were weak and you should be ashamed of how lazy you've been." },
  { id: "interrogate", reply: "Why did you do that? What were you thinking? Don't you care? When will you learn?" },
  {
    id: "wall-of-text",
    reply:
      "Let me explain in detail why this matters. First, every cigarette shortens your life, and second, you need to understand the science of nicotine receptors, and third, you must commit fully today, and fourth, willpower is a muscle you have to train every single hour without exception.",
  },
];

/**
 * A Fake responder that returns each corpus case's scripted reply by matching the
 * (spotlighted) user text in the request. Throws if a request doesn't match any
 * case — a fast signal that the corpus and the driver drifted.
 */
export function corpusResponder(cases: readonly MiCase[]): FakeResponder {
  return (request) => {
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const content = lastUser?.content ?? "";
    const match = cases.find((c) => content.includes(c.userText));
    if (match === undefined) throw new Error(`MI corpus: no case matched request "${content.slice(0, 60)}…"`);
    return match.reply;
  };
}
