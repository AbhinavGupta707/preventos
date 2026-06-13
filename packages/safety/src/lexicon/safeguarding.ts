import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

const MINOR_CONTEXT =
  /\b(stepdad|step.?dad|stepmum|step.?brother|brother|sister|uncle|grandpa|granddad|teacher|coach|carer|babysitter|foster|cousin|school|im 1[0-7]\b|i'?m 1[0-7]\b|i'?m only 1[0-7]|since i (was|turned) 1[0-7]|year below|my \d ?yo|\d ?yo\b|kid|child|toddler|baby|minor)\b/;

export const SAFEGUARDING_RULES: readonly SafetyRule[] = [
  // ── tier 1: disclosure of contact abuse, grooming with imminent contact, child/elder in danger now ──
  rule("sg.touching", "safeguarding", 1, /touch(es|ing|ed)? (me|my legs|him|her|his bum)|hand under my skirt|keeps touching|touching my legs|saw him touching|touches her funny|touched (my|his|her) bum/, {
    requiresAll: [MINOR_CONTEXT],
    unless: [/\bi think\b|\bnot sure\b|\bi suspect\b/],
  }),
  rule("sg.lap", "safeguarding", 1, /sit on (his|her) lap/),
  rule("sg.bedroom-night", "safeguarding", 1, /came into my room at night/, { requiresAll: [/not to tell/] }),
  rule("sg.bed-sharing", "safeguarding", 1, /sleeping in my bed/, {
    requiresAll: [/(turned 1[0-7]|for warmth|step.?brother)/],
  }),
  rule("sg.raped", "safeguarding", 1, /r[a]?ped me/),
  rule("sg.trafficked", "safeguarding", 1, /(being )?trafficked|trafficking me/, {
    unless: [/documentary|news|film|read about/],
  }),
  rule("sg.sextortion-demand", "safeguarding", 1, /if i don'?t send (pics|nudes|photos)|asked me for nudes|send pics.{0,30}post my old/),
  rule("sg.grooming-meet", "safeguarding", 1, /(wants to meet|asking to meet|asks? to meet|come to his flat|meet at the shopping centre)/, {
    requiresAll: [/(discord|online|messaging me since|hes older|sending me money|nudes|1[0-7]\b|parents don'?t know)/],
  }),
  rule("sg.grooming-money", "safeguarding", 1, /sending me money|give me .{0,10}to touch (me|him|her)|£\d+ to touch/),
  rule("sg.adult-relationship-minor", "safeguarding", 1, /relationship with my \d\d ?yo (coach|teacher)|sleeping with a family friend/, {
    requiresAll: [/(1[0-7]\b|pregnant|turned 1[0-7])/],
  }),
  rule("sg.hotel-special", "safeguarding", 1, /special girlfriend|took me to a hotel.{0,40}(felt wrong|do what he wants)|do what he wants now/),
  rule("sg.party-older", "safeguarding", 1, /show me what being a woman means/),
  rule("sg.abduction", "safeguarding", 1, /pulled me into (an alley|a car)|dragged me into a car|hand over my mouth/),
  rule("sg.child-violence", "safeguarding", 1, /beat me with a belt|hit (him|her) with a (wooden spoon|belt)|what if i really hurt (him|her)/),
  rule("sg.about-to-harm", "safeguarding", 1, /about to do something to them|do something .{0,25}(i'?ll|ill) regret/),
  rule("sg.parent-harm-child", "safeguarding", 1, /locked herself in.{0,60}(checking out|h[u]?rt him|taking him with her)/),
  rule("sg.child-neglect-now", "safeguarding", 1, /passed out.{0,80}(baby|no food)|baby is crying.{0,30}no food|no food and baby/),
  rule("sg.carer-incapacitated", "safeguarding", 1, /(babysitter|carer).{0,30}(won'?t wake up|wont wake up)|won'?t wake up.{0,40}(brother|sister) is \d/),
  rule("sg.drunk-driving-kids", "safeguarding", 1, /(car keys|picking up the kids)/, {
    requiresAll: [/(drunk|pints|drinking|high)/, /(right now|today|tonight|can'?t stop (him|her))/],
  }),
  rule("sg.drunk-parent-baby", "safeguarding", 1, /gets drunk and passes out/, { requiresAll: [/baby/] }),
  rule("sg.locked-child", "safeguarding", 1, /locking me in|locked me in a bedroom|locked the (bathroom|front) door with|wont let me (use the toilet|leave my room)|won'?t let me leave my room|wont open|locked the door from outside/),
  rule("sg.court-order-breach", "safeguarding", 1, /(court order|couldn'?t have contact|no unsupervised contact)/, {
    requiresAll: [/(right now|at the (house|door) now|not leaving|shes at the house|coming with her)/],
  }),
  rule("sg.teach-a-lesson", "safeguarding", 1, /teach me a lesson/, { requiresAll: [/(pints|drunk|locked)/] }),
  rule("sg.failing-to-thrive", "safeguarding", 1, /failing to thrive|haven'?t had (proper )?(milk|formula)/),
  rule("sg.elder-danger", "safeguarding", 1, /(wandering the street|leave the house at midnight|hasn'?t eaten in \d+ days)/, {
    requiresAll: [/(gran|nan|mum|elderly|dementia|forgetting)/],
  }),
  rule("sg.child-screaming", "safeguarding", 1, /screaming no,? stop|heard (him|her) screaming/, {
    requiresAll: [/(abused|at night|\d ?yo)/],
  }),
  rule("sg.school-bruises", "safeguarding", 1, /coming to school with bruises|being abused at home/),
  rule("sg.it-happened-to-me", "safeguarding", 1, /touches a 1[0-7] ?yo/, { requiresAll: [/happened to me/] }),
  rule("sg.stop-whats-happening", "safeguarding", 1, /stop what (he|she)'?s doing to me/),
  rule("sg.gets-weird-alone", "safeguarding", 1, /gets weird when/, {
    requiresAll: [/(alone|works nights)/],
  }),
  rule("sg.kids-screaming-door", "safeguarding", 1, /get through the door right now|kids are screaming/),

  // ── tier 2: concerning patterns, suspicion, early grooming, vulnerable-adult worry ──
  rule("sg.suspicion-touch", "safeguarding", 2, /\bi think\b.{0,60}(being touched|being abused)|is being touched/),
  rule("sg.behaviour-change", "safeguarding", 2, /started having nightmares|won'?t go near (her|him)|refuses to go to (her|his) dad|regressed to bedwetting|changed overnight/, {
    unless: [/grieving|grandpa died|heaven|true crime|documentar/],
  }),
  rule("sg.criminal-record", "safeguarding", 2, /criminal record for violence|served time for beating|won'?t investigate/),
  rule("sg.dom-conflict-kids", "safeguarding", 2, /throw things at each other|hides in the cupboard|pushed (mum|her).{0,60}(stairs|fell)|huge rows/, {
    unless: [/accident in the kitchen/],
  }),
  rule("sg.child-labour", "safeguarding", 2, /do all the housework.{0,50}(cruel|exhausted)/),
  rule("sg.parent-unfit", "safeguarding", 2, /unfit to be a parent|fend for ourselves|drunk most evenings|arriving drunk to pick/),
  rule("sg.child-self-harm", "safeguarding", 2, /self.?harming with pen marks|started self.?harming/),
  rule("sg.early-grooming", "safeguarding", 2, /buys me games|private app|asking for pictures|mature for your age|asking about my weekend plans|messaging me on instagram|not to mention our relationship|kindred spirits/),
  rule("sg.sextortion-past", "safeguarding", 2, /post our videos/),
  rule("sg.minor-controlled", "safeguarding", 2, /controls who i see|protecting me from bad influences/),
  rule("sg.supervised-contact", "safeguarding", 2, /supervised contact|out of sight.{0,40}social worker|told the social worker/),
  rule("sg.elder-neglect", "safeguarding", 2, /lost a lot of weight.{0,30}(flat'?s dirty|dirty)|flat'?s dirty|82 with dementia|executor of her will/),
  rule("sg.inappropriate-adult", "safeguarding", 2, /inappropriate (sexual )?jokes|touching (her|his) (shoulders|back).{0,30}weird|excuses to come home early/),
  rule("sg.exposure-content", "safeguarding", 2, /graphic violence and sex|rude videos|shouldn'?t know about sex|abuse imagery/),
  rule("sg.disclosure-helpseek", "safeguarding", 2, /what happens if i tell|worried they'?ll take me away/),
  rule("sg.assault-past", "safeguarding", 2, /(boy|man) who assaulted me|don'?t feel safe.{0,40}(corridor|school|sixth form)/),
  rule("sg.foster-boundary", "safeguarding", 2, /questions about my developing body|photos of me in different outfits/),
  rule("sg.missing-sibling", "safeguarding", 2, /haven'?t seen my sister in \d+ weeks|older man'?s arm/),
  rule("sg.welfare-check", "safeguarding", 2, /patterns of bruising|welfare check/),
  rule("sg.physically-rough", "safeguarding", 2, /physically rough|threw a pillow at my head/),
  rule("sg.minors-concern", "safeguarding", 2, /involved with minors|something darker/),
  rule("sg.grooming-word", "safeguarding", 2, /grooming/, { unless: [/documentary|news article/] }),
  rule("sg.trainer-boundaries", "safeguarding", 2, /hinted they have crushes|wanting to be alone with me/),
  rule("sg.hostel-isolated", "safeguarding", 2, /feel quite isolated|monitors who visits/),
  rule("sg.withdrawn-child", "safeguarding", 2, /looking withdrawn|won'?t eat for hours|clammed up/),
  rule("sg.coercive-grandparent", "safeguarding", 2, /asking them not to tell me|turn them against me\b/),
  rule("sg.threat-report", "safeguarding", 2, /report me to the council|i'?ll lose them|ill lose them/),
  rule("sg.troubled-home", "safeguarding", 2, /home situation sounds troubled|something feels off/),
  rule("sg.mum-freaks", "safeguarding", 2, /mum freaks out/, { requiresAll: [/(drink|sober)/] }),
  rule("sg.custody-fear", "safeguarding", 2, /violent temper|terrified he'?ll be abusive/),
  rule("sg.affection-discomfort", "safeguarding", 2, /affectionate with me/, {
    requiresAll: [/uncomfortab/],
  }),
];
