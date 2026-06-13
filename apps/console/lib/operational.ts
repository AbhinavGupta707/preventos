// Deep import: the @preventos/db index re-exports migrate.ts, whose
// `new URL("../migrations", import.meta.url)` is treated as an un-bundleable
// asset by Next/webpack. The console only needs the query pool, never the
// migration runner, so we import the client module directly.
import { createDb } from "@preventos/db/src/client";

/**
 * Live platform activity, read straight from the real event backbone and core
 * tables (plan WS8 — evidence on real events, not fixtures). All figures are
 * counts of coded rows; no free text or direct identifiers are read, and no
 * per-person rows are exposed. The outcome-trajectory section of /evidence
 * stays on the synthetic cohort until journeys mature enough to compute real
 * outcomes — this section is the operational truth available from day one.
 */
export interface OperationalSummary {
  /** False when DATABASE_URL is unset (e.g. a static build with no backend). */
  readonly configured: boolean;
  /** Set when the database was configured but unreachable/query failed. */
  readonly error?: string;
  readonly people: number;
  readonly activeEnrolments: readonly { readonly vertical: string; readonly count: number }[];
  readonly eventsByType: readonly { readonly type: string; readonly count: number }[];
  readonly decisions: { readonly total: number; readonly sent: number; readonly suppressed: number };
  readonly contacts: { readonly outboundQueued: number; readonly outboundSent: number; readonly inbound: number };
  readonly openEscalations: number;
}

const EMPTY: Omit<OperationalSummary, "configured" | "error"> = {
  people: 0,
  activeEnrolments: [],
  eventsByType: [],
  decisions: { total: 0, sent: 0, suppressed: 0 },
  contacts: { outboundQueued: 0, outboundSent: 0, inbound: 0 },
  openEscalations: 0,
};

const n = (rows: readonly { readonly count: string }[]): number => Number(rows[0]?.count ?? 0);

export async function getOperationalSummary(): Promise<OperationalSummary> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") return { configured: false, ...EMPTY };

  const { pool } = createDb(url);
  try {
    const [people, enrolments, events, decisionTotal, suppressed, contacts, escalations] = await Promise.all([
      pool.query<{ count: string }>("SELECT count(*) FROM core.person"),
      pool.query<{ vertical: string; count: string }>(
        "SELECT vertical, count(*) FROM core.enrolment WHERE status = 'active' GROUP BY vertical ORDER BY vertical",
      ),
      pool.query<{ type: string; count: string }>(
        "SELECT type, count(*) FROM core.event GROUP BY type ORDER BY count(*) DESC, type",
      ),
      pool.query<{ count: string }>("SELECT count(*) FROM core.decision_record"),
      pool.query<{ count: string }>(
        "SELECT count(*) FROM core.decision_record WHERE chosen_action->>'kind' = 'suppressed'",
      ),
      pool.query<{ direction: string; status: string; count: string }>(
        "SELECT direction, status, count(*) FROM core.contact_record GROUP BY direction, status",
      ),
      pool.query<{ count: string }>("SELECT count(*) FROM core.escalation_case WHERE state = 'open'"),
    ]);

    const contactCount = (direction: string, status?: string): number =>
      contacts.rows
        .filter((row) => row.direction === direction && (status === undefined || row.status === status))
        .reduce((sum, row) => sum + Number(row.count), 0);

    const total = n(decisionTotal.rows);
    const suppressedCount = n(suppressed.rows);

    return {
      configured: true,
      people: n(people.rows),
      activeEnrolments: enrolments.rows.map((row) => ({ vertical: row.vertical, count: Number(row.count) })),
      eventsByType: events.rows.map((row) => ({ type: row.type, count: Number(row.count) })),
      decisions: { total, sent: total - suppressedCount, suppressed: suppressedCount },
      contacts: {
        outboundQueued: contactCount("outbound", "queued"),
        outboundSent: contactCount("outbound", "sent"),
        inbound: contactCount("inbound"),
      },
      openEscalations: n(escalations.rows),
    };
  } catch (error) {
    return { configured: true, error: error instanceof Error ? error.message : "database query failed", ...EMPTY };
  } finally {
    await pool.end();
  }
}
