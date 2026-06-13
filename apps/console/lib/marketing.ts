// WP8.2 — marketing funnel for the console: per-programme waitlist counts and
// conversion-event counts, read from the isolated `marketing` schema. Coded
// aggregates only (no per-lead rows, no email). Its own configured/error handling
// keeps a missing marketing schema from breaking the rest of /evidence.
//
// Deep import of the client + marketing modules (not the @preventos/db index) so
// Next never pulls in the migration runner's un-bundleable `new URL(...)` asset.
import { createDb } from "@preventos/db/src/client";
import { funnelCountsByName, waitlistCountsByProgramme } from "@preventos/db/src/marketing";
import type { EventCount, ProgrammeCount } from "@preventos/db/src/marketing";

export interface MarketingFunnel {
  readonly configured: boolean;
  readonly error?: string;
  readonly waitlist: readonly ProgrammeCount[];
  readonly waitlistTotal: number;
  readonly events: readonly EventCount[];
}

const EMPTY = { waitlist: [], waitlistTotal: 0, events: [] } as const;

export async function getMarketingFunnel(): Promise<MarketingFunnel> {
  const url = process.env["DATABASE_URL"];
  if (url === undefined || url === "") return { configured: false, ...EMPTY };

  const { db, pool } = createDb(url);
  try {
    const [waitlist, events] = await Promise.all([
      waitlistCountsByProgramme(db),
      funnelCountsByName(db),
    ]);
    return {
      configured: true,
      waitlist,
      waitlistTotal: waitlist.reduce((sum, row) => sum + row.count, 0),
      events,
    };
  } catch (error) {
    return { configured: true, error: error instanceof Error ? error.message : "query failed", ...EMPTY };
  } finally {
    await pool.end();
  }
}
