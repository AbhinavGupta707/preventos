import type { FastifyInstance, FastifyReply } from "fastify";
import { checkConsent } from "@preventos/consent";
import type { Db } from "@preventos/db";
import { appendSleepWindow, latestSleepWindowFor, recentSleepDiaryEntriesFor } from "@preventos/db";
import {
  DEFAULT_SLEEP_TITRATION_MIN_DIARY_DAYS,
  recommendSleepWindow,
  sleepWindowDurationMin,
  type PersonId,
} from "@preventos/domain";
import { sleepWindowSchema } from "../schemas.js";

async function requireProgrammeDelivery(db: Db, personId: PersonId, reply: FastifyReply): Promise<boolean> {
  if (await checkConsent(db, personId, { purpose: "programme_delivery" })) return true;
  await reply.code(403).send({ error: "programme_delivery consent required" });
  return false;
}

export function registerSleepRoutes(app: FastifyInstance, db: Db): void {
  app.post("/sleep/windows", async (request, reply) => {
    const input = sleepWindowSchema.parse(request.body ?? {});
    const personId = request.personId as PersonId;
    if (!(await requireProgrammeDelivery(db, personId, reply))) return reply;

    const diary = await recentSleepDiaryEntriesFor(db, personId);
    if (diary.length === 0) {
      return reply.code(409).send({ error: "sleep diary entries required before window titration" });
    }

    const previous = await latestSleepWindowFor(db, personId);
    if (previous === undefined && diary.length < DEFAULT_SLEEP_TITRATION_MIN_DIARY_DAYS) {
      return reply.code(409).send({
        error: `at least ${DEFAULT_SLEEP_TITRATION_MIN_DIARY_DAYS} sleep diary entries required before titration`,
      });
    }

    const recommendation = recommendSleepWindow(
      diary.map((entry) => ({
        date: String(entry.date),
        bedTime: entry.bedTime,
        riseTime: entry.riseTime,
        sleepOnsetLatencyMin: entry.sleepOnsetLatencyMin,
        wasoMin: entry.wasoMin,
      })),
      {
        safetySensitiveOccupation: input.safetySensitiveOccupation,
        excessiveDaytimeSleepiness: input.excessiveDaytimeSleepiness,
      },
      { desiredRiseTime: input.desiredRiseTime, effectiveFrom: input.effectiveFrom },
      previous !== undefined
        ? { durationMin: sleepWindowDurationMin(previous.windowStart, previous.windowEnd) }
        : undefined,
    );

    const window = await appendSleepWindow(db, {
      personId,
      version: previous === undefined ? 1 : previous.version + 1,
      windowStart: recommendation.windowStart,
      windowEnd: recommendation.windowEnd,
      effectiveFrom: recommendation.effectiveFrom,
      computedFrom: recommendation.computedFrom,
    });

    return reply.code(201).send({
      data: {
        id: window.id,
        version: window.version,
        windowStart: recommendation.windowStart,
        windowEnd: recommendation.windowEnd,
        durationMin: recommendation.durationMin,
        decision: recommendation.decision,
        safetyFloorApplied: recommendation.safetyFloorApplied,
        signpostRequired: recommendation.signpostRequired,
        computedFrom: recommendation.computedFrom,
      },
    });
  });
}
