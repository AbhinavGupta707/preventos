import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

/** Exertion / emotion / relieved-by-rest framings that downgrade chest symptoms. */
const BENIGN_CHEST = [
  /\b(gym|workout|doms|exercise|running|jog|laughing|comedy|proud|sadness|excited?|excitement|joy|anxiety from work|work stress|holding stress|stress in my shoulders|empathy|emotional|metaphorically)\b/,
];

const REST_RELIEF = [
  /(goes away|settles?|eases?|disappears?)\b.{0,20}(when|with|after)|with rest|after a few minutes|rest and paracetamol/,
];

export const ACUTE_MEDICAL_RULES: readonly SafetyRule[] = [
  // ── tier 1: MI, stroke, anaphylaxis, hypertensive crisis, GI bleed, head injury, resp. failure, pregnancy bleed ──
  rule("am.mi-crushing", "acute_medical", 1, /(crushing|crushed) chest|chest (pain|payne).{0,50}(left arm|arm|jaw|radiat|numb|back)|pressure (in|across) (my )?chest|band tightening|elephant (sitting )?on (my chest|me)|chest.{0,30}(vice|squeez|crushed)/, {
    unless: [...BENIGN_CHEST, ...REST_RELIEF],
  }),
  rule("am.mi-arm-sweat", "acute_medical", 1, /(left arm dead|arm feels numb|arm numb|arm'?s tingly|tingling in both arms|arm went numb)/, {
    requiresAll: [/(chest|heart|ticker|jaw|pain|sweat|clammy|face droopy)/],
    unless: BENIGN_CHEST,
  }),
  rule("am.ticker-mental", "acute_medical", 1, /(ticker|heart)('?s)? (gone|going) mental/, {
    requiresAll: [/(arm|jaw|tingling|pain)/],
    unless: BENIGN_CHEST,
  }),
  rule("am.stroke", "acute_medical", 1, /face (is )?droop|droops? when i try to smile|drooping on one side|words (are |all )?(slurred|jumbled)|speech is slurred|slurred bad|left side (isn'?t working|wouldn'?t work)|right arm.{0,30}(can'?t move|numb)|can'?t move my (right|left) arm|face is all wrong|coming out garbled|curtain came down|vision'?s gone.{0,20}dark on one side|can'?t feel my face.{0,30}(droop|smile)/),
  rule("am.anaphylaxis", "acute_medical", 1, /(lips|throat|tongue|mouth|face)\b.{0,20}(swelling|closing|tight)|throat closing|can'?t swallow|itching (all over|everywhere)|wheezing after/, {
    requiresAll: [/(nicotine|gum|patch|allergic|swelling|itching)/],
    unless: [/\b(news|empathy|anxiety)\b/],
  }),
  // the "/" in "215/125" is stripped by normalization, leaving "215 125"
  rule("am.bp-crisis", "acute_medical", 1, /\b2[0-3]\d (over )?1[1-4]\d\b/),
  rule("am.gi-bleed", "acute_medical", 1, /(vomit(ing|ed)?|throwing up|spitting up|coughing up|threw up) blood/),
  rule("am.head-injury", "acute_medical", 1, /(hit|banged|bang) (my )?head.{0,70}(confused|can'?t remember|cant remember|sick|memory|groggy|headache)|lost consciousness|passed out.{0,50}hit (my|his|her) head|knocked out|head.{0,40}(feel sick and confused)/),
  rule("am.resp-failure", "acute_medical", 1, /can'?t (breathe|brethe) properly|cant brethe|every breath is a gasp|lungs feel like theyre closing|lips (going|turning) blue|inhaled something toxic|so hard to breathe|can barely speak|can'?t finish a sentence/, {
    unless: [/\b(gym|good way|jog|emotional|telling my mum)\b/],
  }),
  rule("am.vape-chest-acute", "acute_medical", 1, /chest (is )?(closing|super tight|tight)/, {
    requiresAll: [/(vap|new brand|liquid|weird)/, /(faint|barely speak|hard to breathe|can'?t breathe|closing)/],
  }),
  rule("am.pregnancy-bleed", "acute_medical", 1, /bleeding (heavily|loads|bad)|heavy pregnancy bleeding|heavy.{0,20}bleeding/, {
    requiresAll: [/pregnan/],
  }),
  rule("am.faint-bleed", "acute_medical", 1, /(palpitations|dizziness|feel faint|felt faint)/, {
    requiresAll: [/pregnan/, /bleed/],
  }),

  // ── tier 2: exertional chest pain, raised BP, palpitations, DVT, minor bleeding, prompt-GP symptoms ──
  rule("am.angina", "acute_medical", 2, /chest (discomfort|tightness|pain\b|feels (a bit )?tight|feels uncomfortable)|tight feeling in my chest/, {
    requiresAll: [/(exertion|exercise|climb|stairs|walking uphill|stress(ed|ful)|with rest|at rest|of rest|minimal|getting worse|now and then|comes and goes|lasting|happened twice)/],
  }),
  rule("am.bp-elevated", "acute_medical", 2, /\b1[5-9]\d (over )?1[01]\d\b/),
  rule("am.bp-high-words", "acute_medical", 2, /blood pressure (was|keeps reading|reading)? ?(very |quite )?high/, {
    unless: [/metaphorically|like my emotions|probably shot up/],
  }),
  rule("am.palpitations", "acute_medical", 2, /palpitations?|irregular (heart)?beats?|skipped beats|heart feels like it'?s jumping|irregular heartbeat/, {
    unless: [/\b(espresso|coffee|caffeine|excited|running|gym)\b/],
  }),
  rule("am.dvt", "acute_medical", 2, /(pain(ful)? and swell|swollen) calf|swelling in my calf|calf.{0,30}(warm|swollen|tighter)/),
  rule("am.breathless", "acute_medical", 2, /short of breath|breathless|wheez(e|ing)|winded easily|breathing (feels|is) harder/, {
    unless: [/\b(gym|good way|jog|gasping but)\b/],
  }),
  rule("am.minor-bleed", "acute_medical", 2, /blood in my spit|blood.?tinged|brought up some blood|coughing.{0,30}blood.?tinged/),
  rule("am.heavy-period", "acute_medical", 2, /heavy period|spotting (and|during)/),
  rule("am.faint-alcohol", "acute_medical", 2, /(feel(ing)? faint|woke (up )?dizzy|dizziness|light.?headed|faint when standing|feel a bit short)/, {
    requiresAll: [/(cutting|quit|stopped|cut down|cut back).{0,30}(alcohol|drinking)|been (cutting|drinking)/],
    unless: [/hungover|dehydrated|sauna|stood up too fast/],
  }),
  rule("am.headache-alcohol", "acute_medical", 2, /headache that won'?t shift|persistent nausea|different from usual/, {
    requiresAll: [/(alcohol|drinking|drink)/],
  }),
  rule("am.nausea-quit", "acute_medical", 2, /nausea and.{0,20}chest|chest discomfort, started when i quit/),
];
