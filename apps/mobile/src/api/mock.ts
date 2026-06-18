import type { BfoSection } from "@preventos/domain";
import type { SleepDiaryInput, SleepWindowInput, SleepWindowView } from "@preventos/api-client";
import type { Result } from "@preventos/shared";
import { ok } from "@preventos/shared";

import { nextBestAction } from "../core/nextBestAction";
import type { NextAction, TodayContext } from "../core/nextBestAction";
import type { ApiPort, JourneyEnrolment } from "./port";

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Local stand-in for apps/api until SVC lands. Coach replies are canned,
 * clearly labelled preview text — never claiming to be the real coach.
 */
const PREVIEW_REPLIES: readonly string[] = [
  "Coach preview — the live coach arrives with the next update. What you wrote is safe here in the meantime. ",
  "One thing that holds up across thousands of quit attempts: urges crest and pass, usually within three minutes. ",
  "If now is a hard moment, the Rescue button works even offline.",
];

export class MockApi implements ApiPort {
  private readonly submitted: BfoSection[] = [];

  async ensureSession(): Promise<Result<{ readonly personId: string }, string>> {
    await wait(20);
    return ok({ personId: "mock-person" });
  }

  async enrolJourney(_input: JourneyEnrolment): Promise<Result<void, string>> {
    await wait(60);
    return ok(undefined);
  }

  async logCraving(_channel: "app" | "web" = "app"): Promise<Result<void, string>> {
    await wait(30);
    return ok(undefined);
  }

  async logSleepDiary(_input: SleepDiaryInput): Promise<Result<void, string>> {
    await wait(40);
    return ok(undefined);
  }

  async createSleepWindow(input: SleepWindowInput): Promise<Result<SleepWindowView, string>> {
    await wait(40);
    return ok({
      id: "mock-sleep-window",
      version: 1,
      windowStart: "23:30",
      windowEnd: input.desiredRiseTime,
      durationMin: 450,
      decision: "initial",
      safetyFloorApplied: input.safetySensitiveOccupation === true || input.excessiveDaytimeSleepiness === true,
      signpostRequired: input.safetySensitiveOccupation === true || input.excessiveDaytimeSleepiness === true,
      computedFrom: { source: "mock" },
    });
  }

  async submitBfoSection(section: BfoSection): Promise<Result<void, string>> {
    await wait(150);
    this.submitted.push(section);
    return ok(undefined);
  }

  async getNextBestAction(ctx: TodayContext): Promise<Result<NextAction, string>> {
    await wait(80);
    return ok(nextBestAction(ctx));
  }

  async streamCoachReply(
    _message: string,
    onToken: (token: string) => void,
  ): Promise<Result<void, string>> {
    for (const sentence of PREVIEW_REPLIES) {
      for (const word of sentence.split(/(?<= )/)) {
        await wait(24);
        onToken(word);
      }
    }
    return ok(undefined);
  }

  async registerPushToken(_token: string): Promise<Result<void, string>> {
    await wait(50);
    return ok(undefined);
  }
}
