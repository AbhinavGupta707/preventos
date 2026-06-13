"use client";

import { useState } from "react";
import { useAppStore } from "../../../lib/store/app-store";
import { syncApp } from "../../../lib/sync";

export default function ConsentPage() {
  const { state, hydrated, update, erase } = useAppStore();
  const [confirmingErase, setConfirmingErase] = useState(false);
  const [erased, setErased] = useState(false);

  if (!hydrated) return <p>Loading…</p>;

  function setConsent(key: "reminders" | "analytics", value: boolean) {
    update((current) => ({
      ...current,
      consent: { ...current.consent, [key]: value, updatedAt: new Date().toISOString() },
    }));
    syncApp({ action: "consent", key, value });
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "preventos-my-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (erased) {
    return (
      <section className="section">
        <h1>Privacy &amp; consent</h1>
        <p className="notice" role="status">
          All data on this device has been deleted. <a href="/app/onboarding">Start again</a> whenever you like.
        </p>
      </section>
    );
  }

  return (
    <section className="section">
      <h1>Privacy &amp; consent</h1>
      <p className="prose">
        Everything you record currently lives on this device only. Every switch starts off and stays off until you
        turn it on.
      </p>

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
          Download my data (JSON)
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
              erase();
              setErased(true);
            }}
          >
            Yes, delete everything
          </button>{" "}
          <button className="button button-quiet" type="button" onClick={() => setConfirmingErase(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button className="button button-quiet" type="button" onClick={() => setConfirmingErase(true)}>
          Delete all my data from this device
        </button>
      )}
    </section>
  );
}
