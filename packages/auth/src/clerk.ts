import { verifyToken } from "@clerk/backend";
import { err, ok, type Result } from "@preventos/shared";
import type { AuthPort, Principal } from "./port.js";
import { STAFF_ROLES, type StaffRole } from "./rbac.js";

export interface ClerkVerifiedClaims {
  readonly sub?: unknown;
  readonly preventos_user_kind?: unknown;
  readonly preventos_person_id?: unknown;
  readonly preventos_staff_id?: unknown;
  readonly preventos_staff_role?: unknown;
  readonly [claim: string]: unknown;
}

export interface ClerkVerifyOptions {
  readonly secretKey: string;
  readonly jwtKey?: string;
  readonly audience?: string | string[];
  readonly authorizedParties?: string[];
}

export type ClerkSessionVerifier = (
  token: string,
  options: ClerkVerifyOptions,
) => Promise<ClerkVerifiedClaims>;

export interface ClerkAuthConfig extends ClerkVerifyOptions {
  readonly verifier?: ClerkSessionVerifier;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function principalFromClerkClaims(claims: ClerkVerifiedClaims): Result<Principal, string> {
  const kind = asString(claims.preventos_user_kind);
  if (kind === "end_user") {
    const personRef = asString(claims.preventos_person_id);
    if (personRef === undefined || !UUID_PATTERN.test(personRef)) return err("missing person reference");
    return ok({ kind: "end_user", personRef });
  }

  if (kind === "staff") {
    const staffId = asString(claims.preventos_staff_id) ?? asString(claims.sub);
    const role = asString(claims.preventos_staff_role);
    if (staffId === undefined) return err("missing staff id");
    if (role === undefined || !isStaffRole(role)) return err("invalid staff role");
    return ok({ kind: "staff", staffId, role });
  }

  return err("invalid user kind");
}

export class ClerkAuthProvider implements AuthPort {
  private readonly verifier: ClerkSessionVerifier;
  private readonly options: ClerkVerifyOptions;

  constructor(config: ClerkAuthConfig) {
    this.verifier = config.verifier ?? ((token, options) => verifyToken(token, options));
    this.options = {
      secretKey: config.secretKey,
      ...(config.jwtKey !== undefined ? { jwtKey: config.jwtKey } : {}),
      ...(config.audience !== undefined ? { audience: config.audience } : {}),
      ...(config.authorizedParties !== undefined ? { authorizedParties: config.authorizedParties } : {}),
    };
  }

  async verifySession(token: string): Promise<Result<Principal, string>> {
    try {
      const claims = await this.verifier(token, this.options);
      return principalFromClerkClaims(claims);
    } catch {
      return err("invalid session");
    }
  }
}
