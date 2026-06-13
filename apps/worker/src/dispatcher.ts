import type pg from "pg";
import type { Db } from "@preventos/db";
import { dispatchPending, type EventHandler, type EventType } from "@preventos/events";
import type { RuleSet } from "@preventos/decisions";
import type { BurdenConfig } from "@preventos/decisions";
import { runDecisionTick } from "./tick.js";

interface LoggerLike {
  info(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

export interface WorkerConfig {
  readonly ruleSet: RuleSet;
  readonly burden?: BurdenConfig;
  readonly timeZone?: string;
  readonly dispatchIntervalMs?: number;
  readonly tickIntervalMs?: number;
  readonly handlers?: Partial<Record<EventType, EventHandler>>;
}

export interface WorkerLoops {
  stop(): void;
}

/**
 * The two worker loops: the outbox dispatcher (at-least-once delivery to
 * handlers; SKIP LOCKED makes concurrent workers safe) and the decision-point
 * tick. Each loop skips a beat rather than overlapping itself when a run
 * outlasts its interval.
 */
export function startLoops(db: Db, pool: pg.Pool, logger: LoggerLike, config: WorkerConfig): WorkerLoops {
  let dispatching = false;
  let ticking = false;

  const dispatchTimer = setInterval(() => {
    if (dispatching) return;
    dispatching = true;
    dispatchPending(pool, config.handlers ?? {})
      .then((result) => {
        if (result.dispatched + result.retried + result.failed > 0) logger.info(result, "outbox dispatch");
      })
      .catch((error: unknown) => logger.error(error, "outbox dispatch failed"))
      .finally(() => {
        dispatching = false;
      });
  }, config.dispatchIntervalMs ?? 5_000);

  const tickTimer = setInterval(() => {
    if (ticking) return;
    ticking = true;
    runDecisionTick(db, {
      ruleSet: config.ruleSet,
      ...(config.burden !== undefined ? { burden: config.burden } : {}),
      ...(config.timeZone !== undefined ? { timeZone: config.timeZone } : {}),
    })
      .then((result) => {
        if (result.sent + result.suppressed > 0) logger.info(result, "decision tick");
      })
      .catch((error: unknown) => logger.error(error, "decision tick failed"))
      .finally(() => {
        ticking = false;
      });
  }, config.tickIntervalMs ?? 60_000);

  return {
    stop() {
      clearInterval(dispatchTimer);
      clearInterval(tickTimer);
    },
  };
}
