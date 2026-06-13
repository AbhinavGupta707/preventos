import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

/**
 * Patterns are written against the normalized view (see normalize.ts):
 * spaced-out runs are joined without spaces ("killmyself"), censor chars are
 * dropped ("kll"), leet is mapped ("su1cide" -> "suicide") — hence the
 * optional-vowel and optional-space forms below.
 */

// "kill myself" tolerant of censoring/joining: kll mself / killmyself / killing myself
const KILL_MYSELF = /k[i]?ll(in|ing)? ?m[ye]? ?self/;

const THOUGHT_CONTEXT = [
  /\b(thought|thoughts|think|thinking|ideation|crossed my mind|fantasi|daydream|wonder|urge|urges)\b/,
];

export const SELF_HARM_RULES: readonly SafetyRule[] = [
  // ── tier 1: stated intent, plan, attempt in progress, means-seeking ──
  rule("sh.kill-myself", "self_harm", 1, KILL_MYSELF, { unless: THOUGHT_CONTEXT }),
  rule("sh.end-it-now", "self_harm", 1, /(going to|gonna|about to) end (it|this|my ?life)/),
  rule("sh.end-now", "self_harm", 1, /\bend(ing)? it (now|tonight|tonite|all tonight)\b/),
  rule("sh.hang", "self_harm", 1, /hang ?my ?self/),
  rule("sh.jump", "self_harm", 1, /jump(ing)? off (the|a) bridge|i'?m jumping tonight/),
  rule("sh.slit-cut-wrists", "self_harm", 1, /slit my wrists?|cut my wrists? open/),
  rule("sh.cut-deep", "self_harm", 1, /cutting (really )?deep.{0,30}(make sure|works)/),
  rule("sh.noose-rope", "self_harm", 1, /(tied|got) (a|the) (noose|rope)|standing on the chair/),
  rule("sh.attempt-in-progress", "self_harm", 1, /middle of my suicide|suicide attempt right now/),
  rule("sh.pills-intent", "self_harm", 1, /(took|taken|swallow(ed|ing)?|necked)\b.{0,60}(pills|paracetamol|bottle|tablets)/, {
    requiresAll: [/(want to die|on purpose|to end (it|this)|sleep forever|not waking up|want to sleep forever)/],
  }),
  rule("sh.swallowing-all-pills", "self_harm", 1, /(swallowing|taking) all (of )?my pills|got the pills ready/),
  rule("sh.drowned-in-pills", "self_harm", 1, /drowned myself in pills/),
  rule("sh.od-to-die", "self_harm", 1, /overdos(e|ing) on my (antidepressants|meds)|i'?m overdosing tonight/),
  rule("sh.gun-self", "self_harm", 1, /\bgun\b.{0,40}(on myself|to his head)|use it on myself/),
  rule("sh.note-tonight", "self_harm", 1, /written a note/, { requiresAll: [/(tonight|doing this)/] }),
  rule("sh.deserve-die-courage", "self_harm", 1, /deserve to die/, { requiresAll: [/courage to do it/] }),
  rule("sh.going-through-with-it", "self_harm", 1, /going through with it/, { requiresAll: [/(tonight|tonite|2nite)/] }),
  rule("sh.planned-out", "self_harm", 1, /planned it all out/),
  rule("sh.rat-poison", "self_harm", 1, /rat poison to drink|buying rat poison/),
  rule("sh.not-exist-make-sure", "self_harm", 1, /(don'?t|dont) want to exist anymore/, {
    requiresAll: [/(make sure|going to|gonna)/],
  }),
  rule("sh.no-trace", "self_harm", 1, /way to do this without anyone (finding out|knowing)/),
  rule("sh.suicide-only-way", "self_harm", 1, /sui?[cs][i]?de? ?(is)? ?the only (way|option)/),
  rule("sh.suicide-tonight", "self_harm", 1, /sui?[cs][i]?de? (tonight|tonite|2nite)/),
  rule("sh.not-waking-up", "self_harm", 1, /not waking up tomorrow|going to sleep and not waking up/),
  rule("sh.means-seeking", "self_harm", 1, /how (many|much) .{0,40}(would|to) kill me|how do i .{0,30}lethal|way to end (my|your) life/),
  rule("sh.noose-instructions", "self_harm", 1, /ty(ing)? a noose|tie a noose/),
  rule("sh.kms", "self_harm", 1, /\bkms\b|\bkys\b( asap)?/),
  rule("sh.unalive-now", "self_harm", 1, /unalive (m[ye] ?self|me\b|rn|right now|tonight|tonite|2nite)/),
  rule("sh.unalive-wish", "self_harm", 1, /wish i (could|cud) (just )?unalive/),
  rule("sh.sewerslide", "self_harm", 1, /sewerslide/, { unless: THOUGHT_CONTEXT }),
  rule("sh.caught-the-bus", "self_harm", 1, /\b(caught|catch) the bus\b/, {
    unless: [/bus (to|home|stop|station|into|this morning)|missed the bus/],
  }),
  rule("sh.where-it-ends", "self_harm", 1, /this is where it ends|at the (train )?station.{0,30}ends/),
  rule("sh.suffocate", "self_harm", 1, /suffocat(e|ing) myself|with a bag.{0,20}almost done/),
  rule("sh.on-purpose-end", "self_harm", 1, /(way )?too (much|many) .{0,30}on purpose to end|on purpose to end this/),
  rule("sh.walked-into-sea", "self_harm", 1, /walked into the sea/, { requiresAll: [/(working|cold)/] }),
  rule("sh.this-is-it", "self_harm", 1, /this is it\b/, { requiresAll: [/(noose|chair|rope|pills|bridge)/] }),
  rule("sh.doing-this-tonight", "self_harm", 1, /i'?m doing this tonight|finally going through with it/),
  rule("sh.breaking-point-rope", "self_harm", 1, /breaking point/, { requiresAll: [/(rope|doing this)/] }),
  rule("sh.done-pretending", "self_harm", 1, /done pretending.{0,40}(not waking up|okay)/),

  // ── tier 2: ideation, urges, history, passive death wish ──
  rule("sh.thought-about", "self_harm", 2, /(thought|thinking|think) about (suicide|k[i]?ll(ing)? ?m[ye]? ?self|ways to hurt myself|hurting myself|my own)/),
  rule("sh.suicidal-thoughts", "self_harm", 2, /suicid[ae]l? (thoughts|ideation)|suicide crossed my mind|having suicidal/, {
    unless: [/used to have|got help for .{0,30}years ago|haven'?t looked back/],
  }),
  rule("sh.sh-thoughts", "self_harm", 2, /\bs ?h\b (thoughts|urges)|self.?harm (urges|thoughts)|unalive (thoughts|ideation)/),
  rule("sh.urges", "self_harm", 2, /urges? (to hurt myself|are getting stronger|came back|comes back|are really bad)/),
  rule("sh.dont-want-to-be", "self_harm", 2, /(don'?t|dont) want to (be alive|be here|exist)/),
  // Passive death wish / ideation phrasings (W3-SAFEPORT cross-check surfaced
  // these as missed by the lexicon but caught by the old mobile gate). Tier 2:
  // ideation → human review. Guarded against the corpus tier-0 hyperbole case
  // ("this hangover is making me want to die").
  rule("sh.want-to-die", "self_harm", 2, /\bwant(ed)? to die\b|\bwanna die\b|\bwant to be dead\b/, {
    unless: [/hangover|headache|migraine|cramps?|\bheat\b|embarrass|shame|boredom|making me want|this (class|meeting|lecture|app|diet|weather|exam)/],
  }),
  rule("sh.ending-my-life", "self_harm", 2, /end(ing)? my life\b/),
  rule("sh.suicide-on-mind", "self_harm", 2, /\bsuicid(e|al)\b[^.!?]{0,20}\bon my mind\b|\bon my mind\b[^.!?]{0,20}\bsuicid(e|al)\b/),
  rule("sh.better-off", "self_harm", 2, /(better off|cope better) without me|better off if i was dead|better without me in it/),
  rule("sh.no-point", "self_harm", 2, /no point (to living|of me|in living)|whats even the point of me|point of me\b/),
  rule("sh.no-future", "self_harm", 2, /(don'?t|dont) see a future for myself|no future for myself/),
  rule("sh.cut-hurt-myself", "self_harm", 2, /i (cut|hurt) myself (after|to|when)|hurt(ing)? myself (to|when)|spent an hour just hurting myself/),
  rule("sh.self-harm-cope", "self_harm", 2, /self.?harming to distract|hurt myself to cope/),
  rule("sh.scars", "self_harm", 2, /scars? (all over|on) my (arms|wrists)|self.?harm scars|my scars make me feel/),
  rule("sh.old-blades", "self_harm", 2, /found my old blades|avoiding sharp objects/),
  rule("sh.past-attempt", "self_harm", 2, /attempted (suicide|when i was younger)|i attempted\b/),
  rule("sh.trying-again", "self_harm", 2, /feel like trying again/),
  rule("sh.dark-thoughts-back", "self_harm", 2, /(dark|those) (thoughts|ones).{0,30}(back|again)|thoughts (won'?t|wont) leave me alone|the dark ones/),
  rule("sh.give-up", "self_harm", 2, /should just give up and let it happen|give up and let it happen/),
  rule("sh.fantasise-gone", "self_harm", 2, /fantasi[sz]ing about|what life would be like if i wasn'?t here|just not existing anymore|not existing anymore/),
  rule("sh.safety-plan", "self_harm", 2, /safety plan.{0,40}(don'?t|dont) want to use/),
  rule("sh.serious-thoughts", "self_harm", 2, /serious suicidal thoughts/),
  rule("sh.ways-i-could", "self_harm", 2, /ways i could hurt myself/),
  rule("sh.finish-the-job", "self_harm", 2, /finish the job/, { requiresAll: [/scars?\b/] }),
  rule("sh.dont-deserve-happy", "self_harm", 2, /(don'?t|dont) (feel i )?deserve to be happy/),
  rule("sh.numb-scares", "self_harm", 2, /scares me how numb i feel/),
  rule("sh.kill-myself-thoughts", "self_harm", 2, /k[i]?ll ?m[ye]? ?self (thoughts|ideation)/, { unguarded: true }),
  rule("sh.told-someone-instead", "self_harm", 2, /crossed my mind yesterday|told my friend instead/),
  rule("sh.therapist-knows", "self_harm", 2, /therapist knows i'?ve been having/),
  rule("sh.feel-suicidal-passive", "self_harm", 2, /some days i (dont|don'?t) want to be here/),
  rule("sh.drink-hurt", "self_harm", 2, /when i drink i think about/),
  rule("sh.everything-darker", "self_harm", 2, /making everything (so much )?darker/),
];
