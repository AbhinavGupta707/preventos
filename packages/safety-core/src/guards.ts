/**
 * Global idiom guards. A lexicon match whose span overlaps a guard span is
 * suppressed (unless the rule is `unguarded`). Guards are deliberately
 * phrase-narrow: they cover the idiomatic use itself, never a whole message,
 * so genuine risk elsewhere in the same message still fires.
 */
export const GUARDS: readonly RegExp[] = [
  // hyperbole around "kill"/"die"
  /\b(i'?d|i would) (kill|murder) (for|to)\b/g,
  /\b(dying|gagging|i'?d die) for (a|an|the|your)\b/g,
  /\b(killing|kills) (me|my)\b/g,
  /\bmurdered me\b/g,
  /\bkilled me\b/g,
  /\bscared (me |us |him |her )?(half )?to death\b/g,
  /\bdie of (embarrassment|shame|laughter|boredom)\b/g,
  /\b(nearly |almost )?died? (laughing|of laughter)\b/g,
  /\bnearly died when\b/g,
  /\bthought i('?d| would) die\b/g,
  /\b(be )?the death of me\b/g,
  /\brather (die|be dead|k[i]?ll ?m[ye]? ?self) than\b/g,
  /\bdead than (hear|listen|go back)\b/g,
  // figurative "suicide"
  /\bsocial suicide\b/g,
  /\bsuicide in slow motion\b/g,
  /\b(score|album) is (absolute |basically |so dark it'?s basically )?suicide\b/g,
  /\bcommits? suicide in (season|the (show|film|movie|book))\b/g,
  /\bsuicide prevention (course|training|workshop)\b/g,
  /\bdeath cult\b/g,
  /\bslow(ly)? killing myself with\b/g,
  /\bform of suicide\b/g,
  /\bwatching a slow death\b/g,
  // figurative medical
  /\bnearly had a heart attack (when|at)\b/g,
  /\bheart (sank|would burst with joy)\b/g,
  /\bheart skip(ped)? a beat (when|reading)\b/g,
  /\ba total stroke\b/g,
  // figurative overdose / withdrawal
  /\boverdos(e|ed|ing) (on|of) (coffee|caffeine|tea|drama|emails?|productivity|sleep|christmas pudding|work|dessert)\b/g,
  /\btotal overdose of\b/g,
  /\bcold turkey on (netflix|coffee|espresso|sugar)\b/g,
  // third-person / quoted / media framing of violence
  /\bwould (kill|murder) (her|him)\b/g,
  /\bdocumentary (about|on)\b/g,
  /\b(tv show|storyline|the news|a book about|in the news)\b/g,
];
