import type { RiskClass, Vertical } from "@preventos/domain";
import type { CrisisResource } from "./resources.js";
import {
  CHILDLINE,
  DOMESTIC_ABUSE_HELPLINE,
  DRINKLINE,
  EMERGENCY,
  NHS_111,
  NSPCC,
  SAMARITANS,
  SHOUT,
} from "./resources.js";

/**
 * WP7.2: scripted crisis flows. Every step is verbatim copy — the LLM never
 * generates or paraphrases any of this (safety invariant 1). Routing is a
 * total, deterministic function of (riskClass, tier, vertical).
 *
 * All flows are night-safe: rendered calm, dark-mode compatible, no autoplay,
 * no bright alert colours — a 2am sleep-programme user in crisis must not be
 * jolted (plan WP7.2 "2am-safe rendering").
 */

export interface CrisisStep {
  readonly id: string;
  readonly script: string;
}

export interface CrisisRoute {
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2;
  readonly vertical: Vertical;
}

export interface CrisisFlow {
  readonly flowId: string;
  readonly riskClass: RiskClass;
  readonly tier: 1 | 2;
  readonly vertical: Vertical;
  readonly steps: readonly CrisisStep[];
  readonly resources: readonly CrisisResource[];
  readonly nightSafe: true;
  readonly emergencyNumber: "999";
}

const ACKNOWLEDGE =
  "Thank you for telling me. What you've shared matters, and you deserve support right now.";

const TIER1_OPENERS: Readonly<Record<RiskClass, string>> = {
  self_harm:
    "I'm really concerned about your safety right now. If you are in immediate danger, please call 999. You can also call Samaritans free on 116 123, any time, day or night.",
  abuse_dv:
    "Your safety comes first. If you are in danger right now, call 999 — if you can't speak, dial 999 then press 55 when prompted. The National Domestic Abuse Helpline is free, confidential and always open: 0808 2000 247.",
  safeguarding:
    "What you've described needs urgent help. If anyone is in immediate danger, call 999 now. The NSPCC (0808 800 5000) and Childline (0800 1111) can act today.",
  overdose:
    "This needs urgent medical attention. Please call 999 now, or 111 if you're unsure — do not wait to see how you feel. Keep any packets or bottles with you to show paramedics.",
  withdrawal_risk:
    "These symptoms can be a medical emergency. Please call 999 now. Alcohol withdrawal seizures and hallucinations need immediate medical care.",
  acute_medical:
    "These symptoms need emergency care. Please call 999 now. If symptoms change or you're unsure, 111 can advise — but do not wait alone with this.",
};

const TIER2_OPENERS: Readonly<Record<RiskClass, string>> = {
  self_harm:
    "I'm glad you said this out loud. You don't have to manage these thoughts alone — a member of our care team will reach out, and support is there whenever you need it: Samaritans, free on 116 123, any time.",
  abuse_dv:
    "What you've described isn't okay, and it isn't your fault. A member of our care team will follow up with you. When you're ready, the National Domestic Abuse Helpline (0808 2000 247) is free and confidential.",
  safeguarding:
    "Thank you for raising this — concerns like this deserve to be taken seriously. Our care team will follow up. The NSPCC (0808 800 5000) can advise on any worry about a child, however uncertain.",
  overdose:
    "It sounds like medicines or substances may be being used in a way that could hurt you. Our care team will check in with you. If anything feels wrong physically, call 111 — they're there around the clock.",
  withdrawal_risk:
    "What you've described suggests your body may have become dependent on alcohol. That changes what's safe — our care team will follow up, and your GP can plan a safe way forward with you.",
  acute_medical:
    "Some of what you've described should be looked at by a clinician soon. Please contact your GP, or call 111 if it gets worse. Our care team will check in with you.",
};

const HANDOFF_T1 =
  "This conversation has been paused while you get help — a trained person from our team has been alerted and the coach will not continue this topic. You are not on your own.";
const HANDOFF_T2 =
  "I've flagged this so a real person from our team follows up with you. The coach will avoid this topic until then.";

/** Vertical-specific additions (drink-aware crisis content, plan E17). */
function verticalSteps(route: CrisisRoute): readonly CrisisStep[] {
  const { riskClass, vertical } = route;
  if (vertical === "alcohol" && (riskClass === "withdrawal_risk" || riskClass === "overdose")) {
    return [
      {
        id: "alcohol-e17-warning",
        script:
          "Important: if your body is dependent on alcohol, do not suddenly stop drinking on your own — stopping abruptly without medical support can be dangerous. Tell the clinicians how much you usually drink so they can keep you safe.",
      },
    ];
  }
  if (vertical === "alcohol" && riskClass === "abuse_dv") {
    return [
      {
        id: "alcohol-dv-note",
        script:
          "If drinking is part of what's happening at home, you can say so — helplines hear this every day and will not judge you.",
      },
    ];
  }
  if (vertical === "sleep") {
    return [
      {
        id: "sleep-night-note",
        script:
          "All of these services are awake right now, even in the middle of the night. You do not need to wait until morning.",
      },
    ];
  }
  return [];
}

function resourcesFor(riskClass: RiskClass, vertical: Vertical): readonly CrisisResource[] {
  const base: Record<RiskClass, readonly CrisisResource[]> = {
    self_harm: [EMERGENCY, SAMARITANS, SHOUT, NHS_111],
    abuse_dv: [EMERGENCY, DOMESTIC_ABUSE_HELPLINE, SAMARITANS],
    safeguarding: [EMERGENCY, NSPCC, CHILDLINE],
    overdose: [EMERGENCY, NHS_111],
    withdrawal_risk: [EMERGENCY, NHS_111],
    acute_medical: [EMERGENCY, NHS_111],
  };
  const extra: CrisisResource[] = [];
  if (vertical === "alcohol") extra.push(DRINKLINE);
  return [...base[riskClass], ...extra];
}

/** Deterministic crisis routing. Total over every (riskClass, tier, vertical). */
export function routeCrisis(route: CrisisRoute): CrisisFlow {
  const opener = route.tier === 1 ? TIER1_OPENERS[route.riskClass] : TIER2_OPENERS[route.riskClass];
  const steps: CrisisStep[] = [
    { id: "acknowledge", script: route.tier === 1 ? opener : ACKNOWLEDGE },
    ...(route.tier === 2 ? [{ id: "support", script: opener }] : []),
    ...verticalSteps(route),
    { id: "handoff", script: route.tier === 1 ? HANDOFF_T1 : HANDOFF_T2 },
  ];
  return {
    flowId: `crisis.${route.riskClass}.t${route.tier}.${route.vertical}`,
    riskClass: route.riskClass,
    tier: route.tier,
    vertical: route.vertical,
    steps,
    resources: resourcesFor(route.riskClass, route.vertical),
    nightSafe: true,
    emergencyNumber: "999",
  };
}
