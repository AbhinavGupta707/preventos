import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

/** Veto for joke/banter framing on threat-shaped idioms ("he'll kill me if I buy more vapes"). */
const JOKE = [/\b(joke[ds]?|joking|laughed|laughing|lol|haha|banter|pub quiz|playfight|play.?wrestl)\b/];

export const ABUSE_DV_RULES: readonly SafetyRule[] = [
  // ── tier 1: active violence, weapon, threat with presence/immediacy ──
  rule("dv.strangle-now", "abuse_dv", 1, /strangled me|chok(e|ed|ing)? ?(me|ing me)|won'?t let go of my neck|grabbed my throat|woke up choking|hands? on me.{0,30}(tonight|can'?t get out)/, {
    unless: [/last (week|month)|weeks ago/],
  }),
  rule("dv.hit-now", "abuse_dv", 1, /(just|jst) (hit|beaten?|punched|beat) me|hit(ting)? me again|beating me\b|punched me|threw me against/, {
    unless: [/use[d]? to hit|years ago|cried and promised/, ...JOKE],
  }),
  rule("dv.beat-bleeding", "abuse_dv", 1, /face is bleeding|bleeding.{0,40}(won'?t|wont) let me call/),
  rule("dv.weapon", "abuse_dv", 1, /\b(knife|gun|guns|hammer|weapon)\b/, {
    requiresAll: [/(use it|shoot|stab|smash|scared|afraid|terrified|threat|said|showed)/],
    unless: [/water gun|nerf/, ...JOKE],
  }),
  rule("dv.kill-threat", "abuse_dv", 1, /(said|says|saying|telling me)( that)? (he|she|they)('?s| would|'?d| will|'?ll)? ?(going to )?(kill|stab|hurt|strangle) me|kill me (tonight|in my sleep)|make it look like suicide/, {
    unless: [/not here now|last week|\bboss\b|\bmanager\b|that'?s just how (she|he) is/, ...JOKE],
  }),
  rule("dv.violence-threat", "abuse_dv", 1, /(he|she)('?ll|'?d| will| would)? ?(said|says)? ?.{0,12}(burn it down|smash (the )?window|break my (legs|ribs)|break them|bash my head|drag me by|make me pay|do (it|worse|something) (again|rly bad|really bad)|teach me a lesson)/, {
    unless: [/won'?t do it again|wont do it again/, ...JOKE],
  }),
  rule("dv.do-worse", "abuse_dv", 1, /(he|she)'?(ll|d)? ?do worse|said.{0,15}(hed|he'?d) do (worse|somethin)/),
  rule("dv.confined", "abuse_dv", 1, /lock(ed|s|ing)? me in|kept me locked|won'?t let me (leave|go\b|out|move)|wouldn'?t let me move|barricaded|trapped in the (bathroom|house|bedroom)|took my shoes/),
  rule("dv.presence", "abuse_dv", 1, /(he|she|ex)('?s| is)? ?(outside|still here|downstairs|in the (room|doorway)|at the door|standing (outside|in the doorway)|watching me sleep|hes here|here now)/, {
    requiresAll: [/(scared|afraid|terrified|threat|hurt|kill|hit|angry|smash|won'?t leave|not leaving|barricaded|broke in|drunk|knife|gun|hammer|do (it|this|worse))/],
  }),
  rule("dv.broke-in", "abuse_dv", 1, /broke into my (flat|house|home)/),
  rule("dv.driving-here", "abuse_dv", 1, /driving to my house|on (his|her|their) way (here|to my)/, {
    requiresAll: [/(burn|threat|scared|hurt|kill|answer)/],
  }),
  rule("dv.coming-for-kids", "abuse_dv", 1, /threatening to take the kids|take my kids\b|hurt the kids|unalive the (kids|children)|hurt my baby/),
  rule("dv.murder-suicide", "abuse_dv", 1, /take me with (him|her)|then unalive himself|unalive me\b/),
  rule("dv.his-suicide-leverage-now", "abuse_dv", 1, /kill himself unless i (stay|answer|come)/, {
    requiresAll: [/(do it now|right now|followed me|50)/],
  }),
  rule("dv.followed", "abuse_dv", 1, /followed me (from work|home)|found me twice/),
  rule("dv.999-blocked", "abuse_dv", 1, /called 999.{0,40}(unplugged|stopped|took the phone)/),
  rule("dv.outside-shelter", "abuse_dv", 1, /outside the (shelter|refuge)/),
  rule("dv.for-a-friend-danger", "abuse_dv", 1, /for a friend/, {
    requiresAll: [/(kill her|hurt her|trapped|plan to hurt)/],
  }),
  rule("dv.crisis-service-watched", "abuse_dv", 1, /crisis service/, { requiresAll: [/regret/] }),
  rule("dv.escaping-tonight", "abuse_dv", 1, /escaping my ex tonight|going to a safe place.{0,40}looking for us/),
  rule("dv.never-hit-but-tonight", "abuse_dv", 1, /never (actually )?h[i]?t me but tonight/),
  rule("dv.cant-get-away", "abuse_dv", 1, /can'?t get away from (him|her) (tonight|tonite)/),
  rule("dv.pregnant-violence", "abuse_dv", 1, /punched me in the stomach/, { requiresAll: [/pregnant/] }),
  rule("dv.afraid-leaving-guns", "abuse_dv", 1, /afraid (2|to) tell (him|her)/, { requiresAll: [/(guns|gun|knife|weapon)/] }),
  rule("dv.banging-window", "abuse_dv", 1, /banging on the (window|door)/, { requiresAll: [/(smash|take my kids|alone)/] }),

  // ── tier 2: coercive control, threats without presence, past abuse with fear ──
  rule("dv.surveillance", "abuse_dv", 2, /tracks my location|reads my (messages|diary)|check(s|ed)? my phone|checks every receipt|watches me sleep|constantly watched|getting mutual friends to report/),
  rule("dv.financial-control", "abuse_dv", 2, /controls (all )?the money|ask permission to buy|keeps my passport|won'?t let me work|no money of my own/),
  rule("dv.isolation", "abuse_dv", 2, /cut me off from my (family|friends)|turn (them|my family) against me|i'?m isolated now|only see him\b/),
  rule("dv.intimidation", "abuse_dv", 2, /never hit me but.{0,40}(throws things|scares|shouts|on edge)|punched the wall next to my head|throws things and shouts|constantly on edge around (him|her)|scares me when (he|she) drinks/),
  rule("dv.emotional-control", "abuse_dv", 2, /silent treatment|accuses me of cheating|nobody else would want me|maybe it'?s my fault|learned to just agree|gets cold and distant|sulks for days/),
  rule("dv.threats-conditional", "abuse_dv", 2, /if i (ever )?(left|leave|took)( him| her)?.{0,40}(harm himself|find me|never see)|he'?d (find me|come back)|finish what (he|she) started|told me last week if/),
  rule("dv.suicide-leverage", "abuse_dv", 2, /kill himself if i don'?t|he'?ll (kill|hurt) himself (unless|if)|threatened? to (harm|hurt) himself|how sad he'?d be without me|brings up his depression/),
  rule("dv.outing-threat", "abuse_dv", 2, /threatened to out me/),
  rule("dv.sexual-coercion", "abuse_dv", 2, /forced me to have sex|wasn'?t ready|won'?t let me take contraception/),
  rule("dv.custody-threats", "abuse_dv", 2, /never see the (kids|children)|take the children away from me|tell them i'?m a bad (mother|father|parent)/),
  rule("dv.quit-sabotage", "abuse_dv", 2, /sabotages me|not allowed to do things for myself|selfish for trying to quit|gets angry and sabotages/),
  rule("dv.past-abuse", "abuse_dv", 2, /use[d]? to hit me|past abuse|the abuse cycle|abuse therapy|disclosed the abuse|hit me.{0,90}did it again/),
  rule("dv.strangle-past", "abuse_dv", 2, /chok[a-z]{0,3} ?me|strangled me/, {
    requiresAll: [/last (week|month)|weeks ago/],
  }),
  rule("dv.stalking-low", "abuse_dv", 2, /won'?t stop messaging me|won'?t accept it'?s over|showing up at my (workplace|work|house)|security says theyre concerned/),
  rule("dv.appointments-control", "abuse_dv", 2, /insisted on coming to all my (medical )?appointments|wouldn'?t talk to me alone|managing my (appointments|medication)/),
  rule("dv.smear", "abuse_dv", 2, /told my boss i was unreliable|said awful things about me to my family|awful things about me/),
  rule("dv.worried-violent", "abuse_dv", 2, /worried (he|she)'?ll become violent|gets aggressive|drinking has become aggressive|vile to me|calls me names/),
  rule("dv.social-media-control", "abuse_dv", 2, /deleted my social media/),
  rule("dv.press-charges", "abuse_dv", 2, /press charges/, { requiresAll: [/(make sure|never see|stuck)/] }),
];
