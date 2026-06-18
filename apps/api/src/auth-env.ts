import { ClerkAuthProvider, FakeAuthProvider, type AuthPort } from "@preventos/auth";
import type { DevSessionIssuer } from "./routes/dev.js";

export type AuthProviderName = "fake" | "clerk";

export interface AuthRuntime {
  readonly provider: AuthProviderName;
  readonly auth: AuthPort;
  readonly devSessions?: DevSessionIssuer;
}

function envFlag(value: string | undefined): boolean {
  return value === "true";
}

function requireEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];
  if (value === undefined || value.trim() === "") throw new Error(`${key} is required for Clerk auth`);
  return value;
}

function splitList(value: string | undefined): string[] | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

function resolveProvider(env: NodeJS.ProcessEnv): AuthProviderName {
  const explicit = env["PREVENTOS_AUTH_PROVIDER"];
  if (explicit === "fake" || explicit === "clerk") return explicit;
  if (explicit !== undefined && explicit !== "") {
    throw new Error("PREVENTOS_AUTH_PROVIDER must be 'fake' or 'clerk'");
  }

  const hasSeedSession = env["DEV_SESSION_TOKEN"] !== undefined || env["DEV_SESSION_PERSON_ID"] !== undefined;
  return envFlag(env["ALLOW_DEV_SESSIONS"]) || hasSeedSession ? "fake" : "clerk";
}

export function buildAuthFromEnv(env: NodeJS.ProcessEnv): AuthRuntime {
  const provider = resolveProvider(env);
  if (provider === "fake") {
    const auth = new FakeAuthProvider();
    const devToken = env["DEV_SESSION_TOKEN"];
    const devPersonId = env["DEV_SESSION_PERSON_ID"];
    if (devToken !== undefined && devPersonId !== undefined) {
      auth.issue(devToken, { kind: "end_user", personRef: devPersonId });
    }
    const devSessions = envFlag(env["ALLOW_DEV_SESSIONS"])
      ? (personId: string): string => {
          const token = `dev-${personId}`;
          auth.issue(token, { kind: "end_user", personRef: personId });
          return token;
        }
      : undefined;
    return { provider, auth, ...(devSessions !== undefined ? { devSessions } : {}) };
  }

  const secretKey = requireEnv(env, "CLERK_SECRET_KEY");
  requireEnv(env, "CLERK_PUBLISHABLE_KEY");
  const audience = splitList(env["CLERK_JWT_AUDIENCE"]);
  const authorizedParties = splitList(env["CLERK_AUTHORIZED_PARTIES"]);
  const auth = new ClerkAuthProvider({
    secretKey,
    ...(env["CLERK_JWT_KEY"] !== undefined && env["CLERK_JWT_KEY"] !== "" ? { jwtKey: env["CLERK_JWT_KEY"] } : {}),
    ...(audience !== undefined ? { audience } : {}),
    ...(authorizedParties !== undefined ? { authorizedParties } : {}),
  });
  return { provider, auth };
}
