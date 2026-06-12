import type { Result } from "@preventos/shared";
import { err, ok } from "@preventos/shared";
import type { StaffRole } from "./rbac.js";

export type Principal =
  | { readonly kind: "end_user"; readonly personRef: string }
  | { readonly kind: "staff"; readonly staffId: string; readonly role: StaffRole };

/**
 * Provider-agnostic auth boundary (plan E5): the platform depends on this
 * port only. Clerk is one adapter; tests and dev use the fake. Wiring the
 * Clerk adapter requires owner-created API keys (tracked in PROGRESS).
 */
export interface AuthPort {
  verifySession(token: string): Promise<Result<Principal, string>>;
}

export class FakeAuthProvider implements AuthPort {
  private readonly sessions = new Map<string, Principal>();

  issue(token: string, principal: Principal): void {
    this.sessions.set(token, principal);
  }

  verifySession(token: string): Promise<Result<Principal, string>> {
    const principal = this.sessions.get(token);
    return Promise.resolve(principal === undefined ? err("invalid session") : ok(principal));
  }
}
