"use client";

import { useState } from "react";
import { useAppStore, todayIso } from "../../../lib/store/app-store";
import { programmeAccess } from "../../../lib/programme-access";
import { syncApp } from "../../../lib/sync";
import { DRINK_PRESETS, drinkUnits, WEEKLY_LOW_RISK_UNITS } from "../../../lib/calculators/units";
import { dayUnits, lastSevenDates, weekSummary } from "../../../lib/diary/drinks";

export default function DrinkLogPage() {
  const { state, hydrated, update } = useAppStore();
  const [context, setContext] = useState("");

  if (programmeAccess("steady") === "gated") {
    return (
      <section className="section">
        <h1>Steady is referral-only right now</h1>
        <p className="notice prose">
          Alcohol moderation is not open in this build. If stopping or cutting down brings shakes, sweats, seizures,
          confusion, or a need to drink first thing in the morning, speak to your GP or call Drinkline on 0300 123 1110.
          Steady is not the right tool on its own for that situation.
        </p>
      </section>
    );
  }

  if (!hydrated) return <p>Loading…</p>;

  const today = todayIso();
  const todayTotal = dayUnits(state.drinkLog, today);
  const week = weekSummary(state.drinkLog, lastSevenDates());
  const todayEntries = state.drinkLog.filter((entry) => entry.date === today);

  function addDrink(presetId: string) {
    const preset = DRINK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const units = Math.round(drinkUnits(preset) * 100) / 100;
    const note = context.trim();
    update((current) => ({
      ...current,
      drinkLog: [
        ...current.drinkLog,
        {
          id: `${today}-${presetId}-${current.drinkLog.length}`,
          date: today,
          label: preset.label,
          units,
          ...(note !== "" ? { context: note } : {}),
        },
      ],
    }));
    syncApp({ action: "drink", date: today, units, label: preset.label, ...(note !== "" ? { context: note } : {}) });
    setContext("");
  }

  function removeDrink(id: string) {
    update((current) => ({ ...current, drinkLog: current.drinkLog.filter((entry) => entry.id !== id) }));
  }

  return (
    <section className="section">
      <h1>Drink log</h1>
      <p className="prose">
        Tap what you had — units are worked out for you. This is neutral record-keeping, not a score. The UK low-risk
        guideline is not more than {WEEKLY_LOW_RISK_UNITS} units a week, spread over three or more days, and it is not a
        target to drink up to.
      </p>
      <p className="notice prose">
        This log is not withdrawal support. If cutting down brings shakes, sweats or a need to drink in the morning,
        stop and speak to your GP or call Drinkline on 0300 123 1110.
      </p>

      <h2>Add a drink</h2>
      <div className="field">
        <label htmlFor="drinkContext">Optional note for pattern spotting</label>
        <input
          id="drinkContext"
          name="drinkContext"
          type="text"
          maxLength={100}
          value={context}
          onChange={(event) => setContext(event.target.value)}
          placeholder="e.g. after work, out with friends"
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", maxWidth: "42rem" }}>
        {DRINK_PRESETS.map((preset) => (
          <button key={preset.id} className="button button-quiet" type="button" onClick={() => addDrink(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      <h2>Today — {todayTotal.toFixed(1)} units</h2>
      {todayEntries.length === 0 ? (
        <p>Nothing logged today{todayTotal === 0 ? " — a drink-free day so far" : ""}.</p>
      ) : (
        <ul>
          {todayEntries.map((entry) => (
            <li key={entry.id} style={{ marginBottom: "0.25rem" }}>
              {entry.label} — {entry.units.toFixed(1)} units{" "}
              {entry.context !== undefined ? <span>({entry.context}) </span> : null}
              <button
                type="button"
                className="button button-quiet"
                style={{ padding: "0.1rem 0.6rem" }}
                onClick={() => removeDrink(entry.id)}
                aria-label={`Remove ${entry.label}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>This week</h2>
      <p aria-live="polite">
        {week.totalUnits.toFixed(1)} units · {week.drinkFreeDays} drink-free day{week.drinkFreeDays === 1 ? "" : "s"}
        {week.overLowRiskGuideline
          ? " — that's above the low-risk guideline. Worth a look at where the units came from."
          : ""}
      </p>
      <p className="notice prose">
        If cutting down is bringing on shakes, sweats or a need to drink in the morning, stop and speak to your GP or
        call Drinkline on 0300 123 1110 — that needs proper medical support.
      </p>
    </section>
  );
}
