import { describe, expect, it } from "vitest";
import { ClerkAuthProvider, principalFromClerkClaims } from "../src/clerk.js";
import { suppressSmallGroups } from "../src/kanon.js";
import { FakeAuthProvider } from "../src/port.js";
import { ROW_LEVEL_ACTIONS, STAFF_ACTIONS, STAFF_ROLES, can } from "../src/rbac.js";

describe("rbac matrix", () => {
  it("is exhaustive: every action resolves for every role without throwing", () => {
    for (const role of STAFF_ROLES) {
      for (const action of STAFF_ACTIONS) {
        expect(typeof can(role, action)).toBe("boolean");
      }
    }
  });

  it("the analyst role can never perform a row-level action", () => {
    for (const action of ROW_LEVEL_ACTIONS) {
      expect(can("analyst", action), `analyst must not ${action}`).toBe(false);
    }
  });

  it("spot checks: advisor enters readings, only platform_admin manages staff", () => {
    expect(can("advisor", "enter_verification_reading")).toBe(true);
    expect(can("service_admin", "enter_verification_reading")).toBe(false);
    for (const role of STAFF_ROLES) {
      expect(can(role, "manage_staff")).toBe(role === "platform_admin");
    }
  });
});

describe("k-anonymity suppression", () => {
  it("removes groups under k entirely and keeps groups at or above k", () => {
    const groups = [
      { key: "quintile-1", count: 12 },
      { key: "quintile-2", count: 5 },
      { key: "quintile-3", count: 4 },
      { key: "quintile-4", count: 0 },
    ];
    const visible = suppressSmallGroups(groups);
    expect(visible.map((g) => g.key)).toEqual(["quintile-1", "quintile-2"]);
  });

  it("property: no surviving group is ever below k, for any k", () => {
    const groups = Array.from({ length: 50 }, (_, i) => ({ key: `g${i}`, count: i % 9 }));
    for (const k of [1, 3, 5, 8]) {
      for (const group of suppressSmallGroups(groups, k)) {
        expect(group.count).toBeGreaterThanOrEqual(k);
      }
    }
  });
});

describe("auth port", () => {
  it("fake provider verifies issued sessions and rejects unknown tokens", async () => {
    const provider = new FakeAuthProvider();
    provider.issue("tok-1", { kind: "staff", staffId: "s1", role: "advisor" });
    const valid = await provider.verifySession("tok-1");
    expect(valid.ok).toBe(true);
    const invalid = await provider.verifySession("tok-2");
    expect(invalid.ok).toBe(false);
  });
});

describe("clerk auth adapter", () => {
  const personId = "11111111-1111-4111-8111-111111111111";

  it("maps Clerk end-user claims to the AuthPort principal without health metadata", () => {
    const principal = principalFromClerkClaims({
      sub: "user_123",
      preventos_user_kind: "end_user",
      preventos_person_id: personId,
      unsafe_note: "ignored",
    });
    expect(principal).toEqual({ ok: true, value: { kind: "end_user", personRef: personId } });
  });

  it("maps Clerk staff claims and leaves row-level authorization to RBAC", () => {
    const principal = principalFromClerkClaims({
      sub: "user_staff",
      preventos_user_kind: "staff",
      preventos_staff_role: "analyst",
    });
    expect(principal).toEqual({ ok: true, value: { kind: "staff", staffId: "user_staff", role: "analyst" } });
    for (const action of ROW_LEVEL_ACTIONS) {
      expect(can("analyst", action)).toBe(false);
    }
  });

  it("rejects missing kind, invalid person ids, and unknown staff roles", () => {
    expect(principalFromClerkClaims({ sub: "user_123" }).ok).toBe(false);
    expect(
      principalFromClerkClaims({
        preventos_user_kind: "end_user",
        preventos_person_id: "user_123",
      }).ok,
    ).toBe(false);
    expect(
      principalFromClerkClaims({
        preventos_user_kind: "staff",
        preventos_staff_id: "s1",
        preventos_staff_role: "superuser",
      }).ok,
    ).toBe(false);
  });

  it("verifies sessions through an injected Clerk verifier and passes verification options", async () => {
    const seen: unknown[] = [];
    const provider = new ClerkAuthProvider({
      secretKey: "sk_test",
      jwtKey: "-----BEGIN PUBLIC KEY-----",
      audience: ["preventos-api"],
      authorizedParties: ["https://app.preventos.example"],
      verifier: async (token, options) => {
        seen.push({ token, options });
        return { preventos_user_kind: "end_user", preventos_person_id: personId };
      },
    });

    const verified = await provider.verifySession("jwt");
    expect(verified).toEqual({ ok: true, value: { kind: "end_user", personRef: personId } });
    expect(seen).toEqual([
      {
        token: "jwt",
        options: {
          secretKey: "sk_test",
          jwtKey: "-----BEGIN PUBLIC KEY-----",
          audience: ["preventos-api"],
          authorizedParties: ["https://app.preventos.example"],
        },
      },
    ]);
  });

  it("fails closed when Clerk verification throws", async () => {
    const provider = new ClerkAuthProvider({
      secretKey: "sk_test",
      verifier: async () => {
        throw new Error("bad jwt");
      },
    });
    await expect(provider.verifySession("bad")).resolves.toEqual({ ok: false, error: "invalid session" });
  });
});
