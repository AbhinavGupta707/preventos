import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

/** As-prescribed / usual-dose framing vetoes ingestion rules. */
const AS_PRESCRIBED = [
  /\b(my usual (dose|amount|number|two|morning)|usual dose|as (directed|prescribed)|prescribed (dose|by|me this)|normal (dose|amounts?|quantities|time)|right intervals|exactly as|packet says|like i always|like always|recommended|doctor (said|gave)|gp (said|prescribed)|on schedule|same time every|at the prescribed|worked fine|works (well|great|fine)|usual (two|second)? ?paracetamol|couple (of )?ibuprofen|usual amount|normal quantities)\b/,
];

const SUBSTANCE =
  /(paracetamol|parasetamol|painkillers?|pills|tablets|sleeping (pills|tablets|stuff)|heroin|opioid|codeine|sedatives?|antihistamines?|antidepressants|meds|medication|cough (syrup|medicine)|ibuprofens?)/;

export const OVERDOSE_RULES: readonly SafetyRule[] = [
  // ── tier 1: dangerous ingestion happened / happening, child ingestion, third-party emergency ──
  rule("od.paracetamol-bulk", "overdose", 1, /\b(1[5-9]|[2-9]\d)\b ?(paracetamol|parasetamol|painkillers|tablets|pills)|(load|loads) of paracetamol|full bottle of paracetamol|bottle of paracetamol|so many painkillers|whole (bottle|supply) of.{0,20}pills|all my pills/, {
    unless: AS_PRESCRIBED,
  }),
  rule("od.lost-count", "overdose", 1, /lost count/, { requiresAll: [SUBSTANCE] }),
  rule("od.cant-feel", "overdose", 1, /can'?t (even )?feel my (face|stomach)|cant feel my/, { requiresAll: [SUBSTANCE] }),
  rule("od.mix-severe", "overdose", 1, /(numb|head feels like it'?s exploding|exploding|feel strange|feeling really strange|can'?t speak properly|losing feeling|idk wha'?s happening|don'?t know what'?s happening)/, {
    requiresAll: [/(mixed|mixing|mixd|m1xd|with|w\b)/, SUBSTANCE, /(alcohol|booze|wine|whisky|vodka|rum|drinking)/],
    unless: AS_PRESCRIBED,
  }),
  rule("od.pills-wine-tonight", "overdose", 1, /sleeping pills with a full bottle of wine|with a full bottle of/),
  rule("od.took-with-symptoms-now", "overdose", 1, /(an hour ago|\d+ ?mins? ago|\d+ minutes ago|\d+ hours? ago|about 40 mins)/, {
    requiresAll: [/(took|taken|t00k|swallowed)/, SUBSTANCE, /(dizzy|sick|strange|unwell|weird|drowsy|blurry|foggy|hurts|numb)/],
    unless: AS_PRESCRIBED,
  }),
  rule("od.double-dose-symptoms", "overdose", 1, /(double|5 of) my (usual )?sleeping pills?/, {
    requiresAll: [/(blurry|drowsy|dizzy|weird|instead of 1)/],
  }),
  rule("od.upped-dose-now", "overdose", 1, /up(p)?ed my sleeping pills/, { requiresAll: [/(tired|now)/] }),
  rule("od.forgot-retook-now", "overdose", 1, /(forgot|f0rgot|can'?t remember|cant remember) if i took/, {
    requiresAll: [/(took|t00k) (them|more)|took them (again|agian|ag41n)/],
  }),
  rule("od.remembered-took-more", "overdose", 1, /just remembered i took.{0,40}took more|still hurts so i took more/),
  rule("od.child-ingestion", "overdose", 1, /(child|kid|toddler|son|daughter|baby|my \d ?yo)\b.{0,60}(swallowed|ate|drank|got into|found my|sucked|eaten)/, {
    requiresAll: [/(e.?liquid|nicotine|vape|patches|pills|tablets|medicine|liquid)/],
  }),
  rule("od.child-lethal-dose", "overdose", 1, /lethal dose for kids|how poisoned are they/),
  rule("od.third-party-down", "overdose", 1, /(friend|mate|mates?|partner|mum|gran|grandma|brother|sister)('?s)?\b.{0,80}(passed out|unresponsive|won'?t wake up|wont wake up|barely conscious|collapsed|vomited blood|can'?t get (them|her|him)|barely get them breathing|on the floor|breathing weird|poisoned (herself|himself))/),
  rule("od.poisoned-self", "overdose", 1, /poisoned (herself|himself|themselves)|took too many antihistamines/, {
    requiresAll: [/(partner|friend|mum|thinks)/],
  }),
  rule("od.blood-vomit", "overdose", 1, /(threw up|throwing up|vomited|vomiting|spitting up) blood/),
  rule("od.rapid-heavy-drinking", "overdose", 1, /(drank|downed|necked)\b.{0,30}(bottle|litre|half a litre)\b.{0,30}(whisky|rum|vodka|wine)?/, {
    requiresAll: [/(losing feeling|can'?t speak|cant speak|in an hour|in like 2 hours)/],
  }),
  rule("od.relapse-cant-stop", "overdose", 1, /(relapsed|week sober|months sober)\b.{0,60}(old rate|can'?t stop|cant stop|necked a whole bottle)/),
  rule("od.fat-handful", "overdose", 1, /fat handful|someone else'?s opioid/),
  rule("od.need-advice-now", "overdose", 1, /whole supply of sleeping pills|need advice now/),
  // "o-v-e-r-d-o-s-e-d on" normalizes to "overdosedon" (run-join fuses the "on")
  rule("od.overdosed-now", "overdose", 1, /(overdos|ovrdos|ovrdoz|overdoz|overd[a-z]?se?|over ?dosed|od'?d)[a-z]* ?(on )?(painkillers|sleeping|my meds)/, {
    unless: [/months ago|3 months ago|booze and my usual/],
  }),
  rule("od.blackout-obfuscated", "overdose", 1, /bl[a-z]ckd[0o]? ?out|blxckd/),
  rule("od.vaping-relapse-spinning", "overdose", 1, /vap(e|ing) again/, {
    requiresAll: [/(after \d+ (months|weeks)|rite now|right now)/, /(spinning|dizzy|head is)/],
  }),
  rule("od.cough-codeine", "overdose", 1, /cough syrup with codeine/),
  rule("od.took-on-purpose", "overdose", 1, /(took|swallowed).{0,40}on purpose/),
  // W3-SAFEPORT: first-person overdose disclosure (parity with retired mobile gate).
  // "overdosed on coffee/emails/sleep/…" idioms stay suppressed by the global guards.
  rule("od.self-overdosed", "overdose", 1, /\b(took|taken) an? overdose\b|\bi'?ve overdosed\b|\bi overdosed\b/),

  // ── tier 2: risky patterns, hypothetical lethality questions, tolerance loss, past events ──
  rule("od.lethality-question", "overdose", 2, /enough to kill someone|dying from too much|what would happen if someone took|survive an overdose|before you need medical help|tolerance to alcohol poisoning|lethal dose|knock me out for good/),
  rule("od.habitual-mixing", "overdose", 2, /(mixing|combined|c0mb1n3d).{0,40}(sedatives|sleeping pills|brands of painkillers)|sedatives with alcohol|sleeping pills w antihistamines|antih[i1]stam[i1]nes/),
  rule("od.routine-double", "overdose", 2, /routinely taking double|taking double my|accidentally taking double|(took|take) them again to be safe/),
  rule("od.mums-pills", "overdose", 2, /tookmymums sleeping pills|took my mum'?s sleeping pills/),
  rule("od.relative-double", "overdose", 2, /took (her|his) .{0,25}meds twice/),
  rule("od.cold-tablets", "overdose", 2, /(ovrdos|overdos)[a-z]* ?on cold tablets/),
  rule("od.tolerance-loss", "overdose", 2, /(sober|dry|not drinking|not smoking)\b.{0,60}(old amount|like i used to|like nothing changed|downed \d+ units|smoked like a pack|drank like i used to)/),
  rule("od.took-more-later", "overdose", 2, /didn'?t sleep so i took more|took more \d+ hours later/),
  rule("od.old-meds", "overdose", 2, /old (bottle of sleeping pills|opioid pills|sleeping pills again)|unused prescriptions|experiment with my old/),
  rule("od.others-meds", "overdose", 2, /taking my mum'?s (blood pressure )?meds|someone else'?s meds/),
  rule("od.greened-out", "overdose", 2, /greened out/),
  rule("od.mix-mild", "overdose", 2, /(wine and took sleeping pills|sleeping pills.{0,30}vodka|mixed with vodka)/, {
    requiresAll: [/(drowsy|texting weird|getting really)/],
  }),
  rule("od.bulk-mistake", "overdose", 2, /(week|month)'?s worth of.{0,20}pills|handful of ibuprofens|bunch of my antidepressants|whole week'?s worth/),
  rule("od.dr-warning-ignored", "overdose", 2, /said not to drink on these meds|don'?t see the harm/),
  rule("od.escalating-use", "overdose", 2, /increasing my intake|considering going stronger|patches.{0,30}vape on top|high dose.{0,20}then i vape/),
  rule("od.stimulant-push", "overdose", 2, /awake \d\d hours|more energy stuff/),
  rule("od.tolerance-massive", "overdose", 2, /tolerance is massive|need like \d+ units to feel/),
  rule("od.big-dose-makeup", "overdose", 2, /big dose to make up/),
  rule("od.past-od", "overdose", 2, /od'?d.{0,30}months ago|still getting headaches|odd? on booze/),
  rule("od.blackout-plain", "overdose", 2, /(blacked|blacking) out.{0,40}(don'?t|dont) know how much/),
  rule("od.heart-racing-antihistamine", "overdose", 2, /(ovur|over) ?dosed on antihistamines|heart is racing really fast/),
  rule("od.cough-medicine-bulk", "overdose", 2, /way too much cough medicine/),
  rule("od.units-question", "overdose", 2, /how many units of alcohol/),
];
