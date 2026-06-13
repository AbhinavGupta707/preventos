// WP8.2 — forward the marketing waitlist + conversion funnel to the domain store
// (apps/api → the isolated `marketing` Postgres schema) when PREVENTOS_API_URL is
// configured. These are PUBLIC endpoints (no session/token). When unconfigured
// or the backend is unreachable, the caller falls back to the local .data NDJSON
// sink so dev/offline still captures — the route shape never changes.
import { ApiClient } from "@preventos/api-client";
import type { FunnelEventInput, WaitlistInput } from "@preventos/api-client";

function client(): ApiClient | undefined {
  const baseUrl = process.env["PREVENTOS_API_URL"];
  if (baseUrl === undefined || baseUrl === "") return undefined;
  return new ApiClient({ baseUrl });
}

/** True when the domain store accepted the signup; false → fall back to NDJSON. */
export async function forwardWaitlist(input: WaitlistInput): Promise<boolean> {
  const api = client();
  if (api === undefined) return false;
  const res = await api.joinWaitlist(input);
  return res.ok;
}

/** True when the domain store accepted the event; false → fall back to NDJSON. */
export async function forwardFunnelEvent(input: FunnelEventInput): Promise<boolean> {
  const api = client();
  if (api === undefined) return false;
  const res = await api.recordFunnelEvent(input);
  return res.ok;
}
