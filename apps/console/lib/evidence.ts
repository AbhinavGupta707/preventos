import { K_ANONYMITY_THRESHOLD, suppressSmallGroups } from "@preventos/auth";
import {
  SYNTHETIC_COHORT,
  buildEvidenceGroups,
  evaluateCohort,
  type EvidenceGroup,
} from "@preventos/outcomes";

/**
 * Server-side evidence aggregation. K-anonymity suppression happens HERE, in
 * the query layer, before anything reaches a component — the page renders
 * only what this module returns, so no UI path can show a group below k
 * (PRD §3.11). Data source is the synthetic fixture cohort until the
 * services assembly projects journeys from real events.
 */

export interface EvidenceHeadline {
  readonly definitionRef: string;
  readonly label: string;
  readonly value: string;
  readonly n: number;
}

export interface EvidenceSummary {
  readonly k: number;
  readonly groups: readonly EvidenceGroup[];
  readonly suppressedGroupCount: number;
  readonly headlines: readonly EvidenceHeadline[];
}

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function getEvidenceSummary(): EvidenceSummary {
  const results = evaluateCohort(SYNTHETIC_COHORT);
  const raw = buildEvidenceGroups(SYNTHETIC_COHORT);
  const groups = suppressSmallGroups(raw, K_ANONYMITY_THRESHOLD);

  const finalSleepWeek = [...results.sleep.trajectory.summary.meanByWeek]
    .reverse()
    .find((week) => week !== null);

  const headlines: readonly EvidenceHeadline[] = [
    {
      definitionRef: results.smoking.quit.definitionRef,
      label: "Smoking — 4-week quit (Russell Standard, ITT)",
      value: pct(results.smoking.quit.summary.quitRate),
      n: results.smoking.quit.summary.n,
    },
    {
      definitionRef: results.vaping.pp7.definitionRef,
      label: "Vaping — 7-day point-prevalence abstinence",
      value: pct(results.vaping.pp7.summary.rate),
      n: results.vaping.pp7.summary.n,
    },
    {
      definitionRef: results.vaping.pp30.definitionRef,
      label: "Vaping — 30-day point-prevalence abstinence",
      value: pct(results.vaping.pp30.summary.rate),
      n: results.vaping.pp30.summary.n,
    },
    {
      definitionRef: results.alcohol.auditCDelta.definitionRef,
      label: "Alcohol — mean AUDIT-C change at 4 weeks (completers)",
      value:
        results.alcohol.auditCDelta.summary.meanDelta === null
          ? "—"
          : results.alcohol.auditCDelta.summary.meanDelta.toFixed(1),
      n: results.alcohol.auditCDelta.summary.completers,
    },
    {
      definitionRef: results.sleep.trajectory.definitionRef,
      label: "Sleep — efficiency, final observed week",
      value: finalSleepWeek ? pct(finalSleepWeek.se / 100) : "—",
      n: finalSleepWeek?.contributors ?? 0,
    },
  ];

  return {
    k: K_ANONYMITY_THRESHOLD,
    groups,
    suppressedGroupCount: raw.length - groups.length,
    headlines,
  };
}
