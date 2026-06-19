"use client";

import { SignInButton, SignOutButton, UserButton, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useAppStore } from "../../../lib/store/app-store";
import { syncApp } from "../../../lib/sync";

const clerkConfigured =
  process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== undefined &&
  process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] !== "";

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ClerkAccountPanel() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="notice">
        <p style={{ marginTop: 0 }}>Checking account session...</p>
      </div>
    );
  }

  return (
    <div className="notice">
      {isSignedIn ? (
        <>
          <p style={{ marginTop: 0 }}>Signed in for live account controls.</p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <UserButton />
            <SignOutButton>
              <button className="button button-quiet" type="button">
                Sign out
              </button>
            </SignOutButton>
          </div>
        </>
      ) : (
        <>
          <p style={{ marginTop: 0 }}>
            Sign in to use live account export and deletion. Account recovery is available from the sign-in flow.
          </p>
          <SignInButton mode="modal">
            <button className="button" type="button">
              Sign in
            </button>
          </SignInButton>
        </>
      )}
    </div>
  );
}

export default function ConsentPage() {
  const { state, hydrated, update, erase } = useAppStore();
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [erased, setErased] = useState(false);
  const [erasedMessage, setErasedMessage] = useState("All data on this device has been deleted.");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);

  if (!hydrated) return <p>Loading…</p>;

  function setConsent(key: "reminders" | "analytics", value: boolean) {
    update((current) => ({
      ...current,
      consent: { ...current.consent, [key]: value, updatedAt: new Date().toISOString() },
    }));
    syncApp({ action: "consent", key, value });
  }

  async function exportData() {
    setBusy("export");
    setStatus(null);
    try {
      const response = await fetch("/api/account/export");
      if (response.ok) {
        downloadJson(await response.json(), "preventos-my-data.json");
        setStatus("Account export downloaded.");
      } else if (response.status === 424) {
        downloadJson(state, "preventos-device-data.json");
        setStatus("Device export downloaded.");
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(body.error ?? "Export failed.");
      }
    } catch {
      downloadJson(state, "preventos-device-data.json");
      setStatus("Device export downloaded.");
    } finally {
      setBusy(null);
    }
  }

  async function eraseData() {
    setBusy("delete");
    setStatus(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok || response.status === 424) {
        erase();
        setErasedMessage(response.ok ? "Account deletion completed. Local device data was cleared too." : "All data on this device has been deleted.");
        setErased(true);
      } else {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus(body.error ?? "Deletion failed.");
      }
    } catch {
      erase();
      setErasedMessage("All data on this device has been deleted.");
      setErased(true);
    } finally {
      setBusy(null);
    }
  }

  if (erased) {
    return (
      <section className="section">
        <h1>Privacy &amp; consent</h1>
        <p className="notice" role="status">
          {erasedMessage} <a href="/app/onboarding">Start again</a> whenever you like.
        </p>
      </section>
    );
  }

  return (
    <section className="section">
      <h1>Privacy &amp; consent</h1>
      <p className="prose">
        Every switch starts off and stays off until you turn it on. In live API mode, export and deletion use your
        authenticated account; offline mode stays on this device.
      </p>

      {clerkConfigured ? (
        <>
          <h2>Account</h2>
          <ClerkAccountPanel />
        </>
      ) : null}

      <h2>Your choices</h2>
      <div style={{ marginBottom: "0.5rem" }}>
        <label>
          <input
            type="checkbox"
            checked={state.consent.reminders}
            onChange={(event) => setConsent("reminders", event.target.checked)}
          />{" "}
          Reminders and check-ins
        </label>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <label>
          <input
            type="checkbox"
            checked={state.consent.analytics}
            onChange={(event) => setConsent("analytics", event.target.checked)}
          />{" "}
          Anonymous usage data to improve the programmes
        </label>
      </div>
      {state.consent.updatedAt ? (
        <p style={{ color: "var(--ink-soft)" }}>Last updated {new Date(state.consent.updatedAt).toLocaleString("en-GB")}</p>
      ) : null}

      <h2>Your data</h2>
      <p>
        <button className="button button-quiet" type="button" onClick={exportData}>
          {busy === "export" ? "Preparing export..." : "Download my data (JSON)"}
        </button>
      </p>

      <h2>Delete everything</h2>
      {confirmingErase ? (
        <div className="notice">
          <p style={{ marginTop: 0 }}>
            This permanently deletes every diary entry, drink log and setting stored on this device. There is no undo.
          </p>
          <button
            className="button"
            type="button"
            style={{ background: "#a33" }}
            onClick={() => {
              void eraseData();
            }}
          >
            {busy === "delete" ? "Deleting..." : "Yes, delete everything"}
          </button>{" "}
          <button className="button button-quiet" type="button" onClick={() => setConfirmingErase(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="button button-quiet" type="button" onClick={() => setConfirmingErase(true)}>
          Delete all my data
        </button>
      )}
      {status !== null ? (
        <p className="notice" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
