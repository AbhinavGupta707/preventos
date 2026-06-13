import type { SafetyRule } from "../types.js";
import { rule } from "../types.js";

/**
 * Alcohol-withdrawal risk (plan E17: dependence indicators are a hard stop).
 * Nicotine/vaping/caffeine/sugar withdrawal is uncomfortable but safe — every
 * rule here is anchored on an alcohol token so "quit smoking and I'm shaking"
 * never fires.
 */

const ALCOHOL =
  /\b(alcohol|drink\w*|drank|drunk|booze|wine|whisky|vodka|beer|sober|the bottle|units|dry\b)\b/;

const NON_ALCOHOL_WITHDRAWAL = [
  /\b(caffeine|coffee|espresso|tea|sugar|netflix|cigs?|cigarettes?|smoking|vap(e|ing)|nicotine)\b/,
];

/** Recent abrupt cessation of drinking. */
const STOPPED =
  /(stopped|stoped|quit|came off|went off|withdrew from|cold turkey|haven'?t (had|drunk|touched)|havent (had|drank|drunk)|no (alcohol|drink|drinking)|days? (sober|no drink)|hours (sober|no)|sober from|day \d of (no|not|quitting|trying)|\d+ days? (sober|no)|morning after stopping|(my )?last drink \d+ days? ago)/;

/** Symptoms compatible with severe withdrawal / DTs happening now. */
const SEVERE_NOW =
  /(seiz(ure|ing|ed|in)|see?z[i]?in|fit(s|ting|tin)?\b|convuls|\bdts\b|delirium|hallucinat|seeing (things|shadows|double)|seein (things|shadows)|hearing voices|crawl(ing|in)? on|(aren'?t|arent|aint|not) (there|real)\b|shak(ing|in) (uncontrollably|uncontrolably|so (hard|bad(ly)?))|can'?t stop (the )?shaking|cant stop it|won'?t stop (shaking|spinning)|everything is shak|drenched in sweat|sweating (through|buckets)|heart (is )?racing (out of control|wildly)|gonna explode|room (is )?spinning|the horrors|rattlin\b|can'?t (think straight|tell what'?s real|see (straight|straite|properly)|focus my eyes|hold (anything|a cup)|pick anything up)|cant (see straite|focus)|body (won'?t|wont|is) (obey|listen|jerking|convulsin|locking)|lost consciousness|i'?m confused|im confused|outta control|things (movin|moving|walkin|crawl))/;

export const WITHDRAWAL_RULES: readonly SafetyRule[] = [
  // ── tier 1: abrupt alcohol cessation + severe symptoms now ──
  rule("wd.severe-now", "withdrawal_risk", 1, SEVERE_NOW, {
    requiresAll: [ALCOHOL, STOPPED],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.seizure-now", "withdrawal_risk", 1, /(having|had|got|i'?m|im) (a )?(seizure|fit\b|fits\b|convulsions)|fittin\b|seizin\b|started fitting|i seized|keep seizing|proper convulsions/, {
    requiresAll: [ALCOHOL],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),

  // ── tier 2: dependence indicators (E17 hard stop), relief drinking, prior withdrawal, home detox ──
  rule("wd.morning-drinking", "withdrawal_risk", 2, /(drink|drinking|have a drink|need a drink|had a drink|have one|my first drink)\b.{0,40}(first thing|in the morning|before breakfast|b4 work|before work|when i wake up|every morning)|morning drink|first drink of the day|drinking first thing|drink b4 work/, {
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.relief-drinking", "withdrawal_risk", 2, /(drink|drank|drinking|have (one|some))\b.{0,40}(stop (the )?(shak|sweats)|steady (myself|my nerves)|settle down|to feel normal|make it stop|stop my hands)/, {
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.shakes-without", "withdrawal_risk", 2, /(get|got|start|starts|getting) the shakes|shakes (start|and sweats)|tremors if i don'?t drink|withdraw[a]?l (tremors|symptoms|seizure)|hands shake constantly|shaking.{0,40}didn'?t drink|i get (shaky|sweaty|the shakes)|get(s)? (sweaty|shaky)/, {
    requiresAll: [ALCOHOL],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.prior-seizure", "withdrawal_risk", 2, /(seizure|seize|fit\b).{0,60}(when i (tried to )?stop|tried to stop|stopped|quit|years? ago|last year|ended up in hospital)|might seize|could seize|seize if i stop|withdrawal seizures? before/, {
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.dependence", "withdrawal_risk", 2, /\bdependen(ce|t)|\bdependan(ce|t)/, {
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.withdrawal-medical", "withdrawal_risk", 2, /withdraw[a]?l (symptoms|for days)/, {
    requiresAll: [/(doctor|gp|medical|supervis|hospital|without help|relapse)/],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.home-detox", "withdrawal_risk", 2, /taper(ing)? (myself|at home)|try taper|home detox|detox.{0,30}(at home|alone|myself|plan|schedule)|reduce gradually|stoppin on my own|do it (alone|myself) at home|quit but.{0,30}(scared|trying) to do it (alone|myself)/, {
    requiresAll: [/(alcohol|drink\w*|drank|booze|sober|doctor|gp|supervis|shakes|dependen|dependan)/],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.cant-function", "withdrawal_risk", 2, /can'?t (function|do this at home alone)\b.{0,40}(drink|without a drink)|need a drink to function|have to drink (again|before)|got to have a drink|ive got to have a drink/, {
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.day-counter-symptoms", "withdrawal_risk", 2, /(day \d|three days|2 days|two days)\b.{0,60}(shak|sweat|dizzy|withdrawal|drinking again)/, {
    requiresAll: [ALCOHOL, /(quit|sober|stop|off|trying|no drink)/],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.scared-to-stop", "withdrawal_risk", 2, /(scared|terrified|frightened|worried) (to|about) (stop|try|quit|trying)/, {
    requiresAll: [ALCOHOL, /(seizure|withdrawal|withdrawl|shakes|hospital|doctor|supervis)/],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
  rule("wd.cycle", "withdrawal_risk", 2, /(go|gone|going|went) back to drinking|drink again to|so i (just )?drink|i alwys drink|always gone back to drinking|stuck in this cycle/, {
    requiresAll: [/(shak|sweat|sick|ill|withdraw|races)/],
    unless: NON_ALCOHOL_WITHDRAWAL,
  }),
];
