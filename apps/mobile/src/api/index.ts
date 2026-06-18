import { FetchApi } from "./fetch";
import { MockApi } from "./mock";
import type { ApiPort } from "./port";

/**
 * apps/api origin, inlined by Expo at build (EXPO_PUBLIC_* convention). When
 * set, the app talks to the live backend via FetchApi; unset, it runs fully
 * offline/preview on MockApi (the default for tests and store builds).
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL;
const allowDevSessions = process.env.EXPO_PUBLIC_ALLOW_DEV_SESSIONS === "true";

export const api: ApiPort = baseUrl ? new FetchApi({ baseUrl, allowDevSessions }) : new MockApi();

export { MockApi } from "./mock";
export { FetchApi } from "./fetch";
export type { ApiPort, JourneyEnrolment } from "./port";
