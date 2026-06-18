// WP W3-WIRE — server-side proxy to apps/api via the shared client. Web app
// flows are local-first (localStorage) for offline UX; this mirrors each write
// to the real backend so the app is no longer a localStorage-only island.
//
// Dev session model: a single module-cached dev person stands in for Clerk
// until owner keys land (PROGRESS WP1.5). Unset PREVENTOS_API_URL → no-op
// (synced:false), so the app still runs fully local with no backend.
import { ApiClient } from "@preventos/api-client";
import type { SleepWindowView } from "@preventos/api-client";
import type { SyncAction } from "./sync-schema";

const PROGRAMME_VERTICAL = {
  quitkit: "smoking",
  exhale: "vaping",
  steady: "alcohol",
  nightshift: "sleep",
} as const;

const CONSENT_PURPOSE = { reminders: "proactive_contact", analytics: "analytics" } as const;

let devSessionToken: string | undefined;

/** Test seam: drop the cached dev session between cases. */
export function resetApiSessionForTest(): void {
  devSessionToken = undefined;
}

export function apiConfigured(): boolean {
  const url = process.env["PREVENTOS_API_URL"];
  return url !== undefined && url !== "";
}

function devSessionsAllowed(): boolean {
  return process.env["ALLOW_DEV_SESSIONS"] === "true";
}

function client(token: string | undefined): ApiClient | undefined {
  const baseUrl = process.env["PREVENTOS_API_URL"];
  if (baseUrl === undefined || baseUrl === "") return undefined;
  return new ApiClient({ baseUrl, getToken: () => token ?? devSessionToken });
}

export interface SyncResult {
  readonly synced: boolean;
  readonly error?: string;
  readonly sleepWindow?: SleepWindowView;
}

export async function syncToApi(action: SyncAction, bearerToken?: string): Promise<SyncResult> {
  const api = client(bearerToken);
  if (api === undefined) return { synced: false };

  if (bearerToken === undefined && devSessionToken === undefined) {
    if (!devSessionsAllowed()) return { synced: false, error: "Authentication required." };
    const session = await api.createDevSession();
    if (!session.ok) return { synced: false, error: session.error.message };
    devSessionToken = session.value.token;
  }

  switch (action.action) {
    case "enrol": {
      const programmeDelivery = await api.grantConsent({ purpose: "programme_delivery" });
      if (!programmeDelivery.ok) return { synced: false, error: programmeDelivery.error.message };
      if (action.reminders) await api.grantConsent({ purpose: "proactive_contact" });
      if (action.analytics) await api.grantConsent({ purpose: "analytics" });
      for (const slug of action.programmes) {
        const vertical = PROGRAMME_VERTICAL[slug];
        const enrol = await api.enrol({ vertical });
        // 409 = already enrolled in this vertical; idempotent re-onboarding.
        if (!enrol.ok && enrol.error.status !== 409) return { synced: false, error: enrol.error.message };
        if (action.quitDate !== undefined && (vertical === "smoking" || vertical === "vaping")) {
          await api.createPlan({ vertical, type: "quit", slots: { quitDate: action.quitDate } });
        }
      }
      return { synced: true };
    }
    case "drink": {
      const res = await api.logDrink({
        date: action.date,
        units: action.units,
        ...(action.label !== undefined ? { drinkType: action.label } : {}),
        ...(action.context !== undefined ? { context: action.context } : {}),
      });
      return res.ok ? { synced: true } : { synced: false, error: res.error.message };
    }
    case "sleep": {
      // Web captures one get-up time; the API models final-wake and rise
      // separately, so we map get-up to both.
      const res = await api.logSleepDiary({
        date: action.date,
        bedTime: action.bedTime,
        sleepOnsetLatencyMin: Math.round(action.sleepDelayMin),
        wasoMin: Math.round(action.nightAwakeMin),
        finalWakeTime: action.getUpTime,
        riseTime: action.getUpTime,
      });
      return res.ok ? { synced: true } : { synced: false, error: res.error.message };
    }
    case "sleepWindow": {
      const res = await api.createSleepWindow({
        desiredRiseTime: action.desiredRiseTime,
        effectiveFrom: action.effectiveFrom,
        safetySensitiveOccupation: action.safetySensitiveOccupation,
        excessiveDaytimeSleepiness: action.excessiveDaytimeSleepiness,
      });
      return res.ok ? { synced: true, sleepWindow: res.value } : { synced: false, error: res.error.message };
    }
    case "consent": {
      const purpose = CONSENT_PURPOSE[action.key];
      const res = action.value
        ? await api.grantConsent({ purpose })
        : await api.revokeConsent({ purpose });
      return res.ok ? { synced: true } : { synced: false, error: res.error.message };
    }
  }
}

export function syncResultPayload(result: SyncResult): Record<string, unknown> {
  return {
    synced: result.synced,
    ...(result.error !== undefined ? { error: result.error } : {}),
    ...(result.sleepWindow !== undefined ? { sleepWindow: result.sleepWindow } : {}),
  };
}
