/**
 * UK crisis resources (single source of truth for the platform side; the
 * isolated apps/crisis-static page repeats them and a red-team consistency
 * test keeps the two in sync). Numbers pending G3 clinical sign-off
 * verification — same caveat as content/alcohol referral scripts.
 */

export interface CrisisResource {
  readonly name: string;
  readonly phone?: string;
  readonly textLine?: string;
  readonly availability: string;
  readonly note?: string;
}

export const EMERGENCY: CrisisResource = {
  name: "Emergency services",
  phone: "999",
  availability: "24/7",
  note: "If you or someone else is in immediate danger, call 999 now.",
};

export const NHS_111: CrisisResource = {
  name: "NHS 111",
  phone: "111",
  availability: "24/7",
  note: "Urgent medical advice when it's not a 999 emergency.",
};

export const SAMARITANS: CrisisResource = {
  name: "Samaritans",
  phone: "116 123",
  availability: "24/7, free",
  note: "Whatever you're going through, you can talk to someone.",
};

export const SHOUT: CrisisResource = {
  name: "Shout",
  textLine: "Text SHOUT to 85258",
  availability: "24/7, free",
  note: "Confidential text support if talking feels too hard right now.",
};

export const DOMESTIC_ABUSE_HELPLINE: CrisisResource = {
  name: "National Domestic Abuse Helpline",
  phone: "0808 2000 247",
  availability: "24/7, free",
  note: "Run by Refuge. Confidential support for anyone experiencing abuse.",
};

export const NSPCC: CrisisResource = {
  name: "NSPCC",
  phone: "0808 800 5000",
  availability: "Mon-Fri, free",
  note: "If you're worried about a child.",
};

export const CHILDLINE: CrisisResource = {
  name: "Childline",
  phone: "0800 1111",
  availability: "24/7, free",
  note: "For anyone under 19 — about anything.",
};

export const DRINKLINE: CrisisResource = {
  name: "Drinkline",
  phone: "0300 123 1110",
  availability: "Weekdays 9am-8pm, weekends 11am-4pm",
  note: "Free, confidential advice about alcohol.",
};

export const ALL_RESOURCES: readonly CrisisResource[] = [
  EMERGENCY,
  NHS_111,
  SAMARITANS,
  SHOUT,
  DOMESTIC_ABUSE_HELPLINE,
  NSPCC,
  CHILDLINE,
  DRINKLINE,
];
