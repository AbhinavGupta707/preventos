"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useAppStore, todayIso } from "../../../lib/store/app-store";
import { programmeAccess, publicProgrammes } from "../../../lib/programme-access";
import { syncApp } from "../../../lib/sync";
import type { AppProgramme } from "../../../lib/store/types";

const PROGRAMME_OPTIONS: ReadonlyArray<{ slug: AppProgramme; label: string; gatedLabel?: string }> = [
  { slug: "quitkit", label: "QuitKit — quit smoking" },
  { slug: "exhale", label: "Exhale — step down vaping" },
  { slug: "steady", label: "Steady — internal alcohol build", gatedLabel: "Steady — referral-only boundary" },
  { slug: "nightshift", label: "Nightshift — internal sleep build", gatedLabel: "Nightshift — internal only" },
];

export default function OnboardingPage() {
  const { state, hydrated, update } = useAppStore();
  const [selected, setSelected] = useState<readonly AppProgramme[] | null>(null);
  const [saved, setSaved] = useState(false);

  if (!hydrated) return <p>Loading…</p>;

  const programmes = publicProgrammes(selected ?? state.programmes);
  const needsQuitDate = programmes.includes("quitkit") || programmes.includes("exhale");
  const includesSteady = programmes.includes("steady");
  const gatedSteady = programmeAccess("steady") === "gated";
  const gatedNightshift = programmeAccess("nightshift") === "gated";

  function toggle(slug: AppProgramme) {
    if (programmeAccess(slug) === "gated") return;
    setSaved(false);
    setSelected(programmes.includes(slug) ? programmes.filter((p) => p !== slug) : [...programmes, slug]);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quitDate = String(data.get("quitDate") ?? "");
    const dailySpend = Number(data.get("dailySpend") ?? 0);
    const reminders = data.get("consent-reminders") === "on";
    const analytics = data.get("consent-analytics") === "on";
    update((current) => ({
      ...current,
      onboarded: true,
      programmes: [...programmes],
      quitDate: needsQuitDate && quitDate ? quitDate : current.quitDate,
      dailySpendGbp: dailySpend > 0 ? dailySpend : current.dailySpendGbp,
      consent: { reminders, analytics, updatedAt: new Date().toISOString() },
    }));
    syncApp({
      action: "enrol",
      programmes: [...programmes],
      reminders,
      analytics,
      ...(needsQuitDate && quitDate ? { quitDate } : {}),
    });
    setSaved(true);
  }

  return (
    <section className="section">
      <h1>Set up your programmes</h1>
      <form onSubmit={onSubmit}>
        <fieldset style={{ border: "none", padding: 0, margin: "0 0 1.5rem" }}>
          <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Choose one or more programmes</legend>
          {PROGRAMME_OPTIONS.map((option) => {
            const access = programmeAccess(option.slug);
            const gated = access === "gated";
            return (
              <div key={option.slug} style={{ marginBottom: "0.5rem" }}>
                <label aria-disabled={gated}>
                  <input
                    type="checkbox"
                    checked={programmes.includes(option.slug)}
                    disabled={gated}
                    onChange={() => toggle(option.slug)}
                  />{" "}
                  {gated ? option.gatedLabel ?? option.label : option.label}
                  {access === "internal" ? " (internal)" : gated ? " (gated)" : ""}
                </label>
              </div>
            );
          })}
        </fieldset>

        {gatedSteady || gatedNightshift ? (
          <div className="notice" style={{ marginBottom: "1.5rem" }}>
            {gatedSteady ? (
              <p style={{ marginTop: 0 }}>
                <strong>Steady:</strong> alcohol moderation is not open in this build. If stopping or cutting down
                brings shakes, sweats, seizures, confusion, or a need to drink first thing in the morning, speak to your
                GP or call Drinkline on 0300 123 1110.
              </p>
            ) : null}
            {gatedNightshift ? (
              <p style={{ marginBottom: 0 }}>
                <strong>Nightshift:</strong> sleep diary and sleep-window tools are internal while the safety constants
                and claims posture are reviewed.
              </p>
            ) : null}
          </div>
        ) : null}

        {includesSteady ? (
          <div className="notice" style={{ marginBottom: "1.5rem" }}>
            <p style={{ marginTop: 0 }}>
              <strong>Before you start Steady:</strong> if stopping or cutting down gives you shakes, sweats or
              seizures, or you need a drink first thing in the morning, cutting down on your own can be dangerous.
              Please speak to your GP or call Drinkline on 0300 123 1110 instead — Steady is not the right tool on its
              own for that situation.
            </p>
            <label>
              <input type="checkbox" name="steady-ack" required /> I understand, and none of that applies to me
            </label>
          </div>
        ) : null}

        {needsQuitDate ? (
          <>
            <div className="field">
              <label htmlFor="quitDate">Your quit date</label>
              <input id="quitDate" name="quitDate" type="date" defaultValue={state.quitDate ?? todayIso()} />
            </div>
            <div className="field">
              <label htmlFor="dailySpend">What you spend a day (£, for your savings tally)</label>
              <input
                id="dailySpend"
                name="dailySpend"
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                defaultValue={state.dailySpendGbp ?? ""}
              />
            </div>
          </>
        ) : null}

        <fieldset style={{ border: "none", padding: 0, margin: "0 0 1.5rem" }}>
          <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Your choices (both off by default)</legend>
          <div>
            <label>
              <input type="checkbox" name="consent-reminders" defaultChecked={state.consent.reminders} /> Send me
              reminders and check-ins
            </label>
          </div>
          <div>
            <label>
              <input type="checkbox" name="consent-analytics" defaultChecked={state.consent.analytics} /> Use my
              anonymous usage data to improve the programmes
            </label>
          </div>
        </fieldset>

        <button className="button" type="submit" disabled={programmes.length === 0}>
          Save and start
        </button>
        {saved ? (
          <p role="status">
            Saved. <a href="/app">Go to your day</a>
          </p>
        ) : null}
      </form>
    </section>
  );
}
