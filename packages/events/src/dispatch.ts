import type pg from "pg";
import type { EventType } from "./catalogue.js";

export interface DispatchableEvent {
  readonly eventId: bigint;
  readonly type: EventType;
  readonly personId?: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export type EventHandler = (event: DispatchableEvent) => Promise<void>;

export interface DispatchOptions {
  readonly batchSize?: number;
  readonly maxAttempts?: number;
  readonly now?: Date;
}

export interface DispatchResult {
  readonly dispatched: number;
  readonly retried: number;
  readonly failed: number;
}

const BACKOFF_BASE_SECONDS = 30;

/**
 * Processes pending outbox rows with SKIP LOCKED (safe for concurrent
 * workers). Handler failure retries with exponential backoff up to
 * maxAttempts, then the row is marked failed (alerting hooks read that
 * status). Topics with no registered handler are dispatched as no-ops.
 */
export async function dispatchPending(
  pool: pg.Pool,
  handlers: Partial<Record<EventType, EventHandler>>,
  options: DispatchOptions = {},
): Promise<DispatchResult> {
  const { batchSize = 50, maxAttempts = 5 } = options;
  const now = options.now ?? new Date();
  const client = await pool.connect();
  let dispatched = 0;
  let retried = 0;
  let failed = 0;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      outbox_id: string;
      attempts: number;
      event_id: string;
      type: string;
      person_id: string | null;
      payload: Record<string, unknown>;
      occurred_at: Date;
    }>(
      `SELECT o.id AS outbox_id, o.attempts, e.id AS event_id, e.type, e.person_id, e.payload, e.occurred_at
         FROM core.outbox o JOIN core.event e ON e.id = o.event_id
        WHERE o.status = 'pending' AND o.next_attempt_at <= $1
        ORDER BY o.id
        LIMIT $2
        FOR UPDATE OF o SKIP LOCKED`,
      [now, batchSize],
    );
    for (const row of rows) {
      const handler = handlers[row.type as EventType];
      try {
        if (handler !== undefined) {
          await handler({
            eventId: BigInt(row.event_id),
            type: row.type as EventType,
            ...(row.person_id === null ? {} : { personId: row.person_id }),
            payload: row.payload,
            occurredAt: row.occurred_at,
          });
        }
        await client.query(
          "UPDATE core.outbox SET status = 'dispatched', dispatched_at = $2 WHERE id = $1",
          [row.outbox_id, now],
        );
        dispatched += 1;
      } catch {
        const attempts = row.attempts + 1;
        if (attempts >= maxAttempts) {
          await client.query("UPDATE core.outbox SET status = 'failed', attempts = $2 WHERE id = $1", [
            row.outbox_id,
            attempts,
          ]);
          failed += 1;
        } else {
          const backoffMs = BACKOFF_BASE_SECONDS * 1000 * 2 ** attempts;
          await client.query(
            "UPDATE core.outbox SET attempts = $2, next_attempt_at = $3 WHERE id = $1",
            [row.outbox_id, attempts, new Date(now.getTime() + backoffMs)],
          );
          retried += 1;
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { dispatched, retried, failed };
}
