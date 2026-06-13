"use client";

import { useState } from "react";
import { sleepDebt } from "../lib/calculators/sleep";
import { track } from "../lib/track";

const NIGHT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function SleepDebtCalculator() {
  const [needHours, setNeedHours] = useState(8);
  const [nights, setNights] = useState<readonly number[]>([7, 7, 7, 7, 7, 7, 7]);
  const [calculated, setCalculated] = useState(false);

  const debt = sleepDebt({ needHours, sleptHours: nights });

  function setNight(index: number, value: number) {
    setNights(nights.map((hours, i) => (i === index ? value : hours)));
  }

  function onCalculate() {
    setCalculated(true);
    track("sleep_debt_calculated", { debtHours: Math.round(debt * 10) / 10 });
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="need-hours">Hours of sleep you need a night</label>
        <input
          id="need-hours"
          type="number"
          min={4}
          max={12}
          step={0.5}
          inputMode="decimal"
          value={needHours}
          onChange={(event) => setNeedHours(Number(event.target.value))}
        />
      </div>
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Hours you actually slept, last seven nights</legend>
        {NIGHT_LABELS.map((label, index) => (
          <div className="field" key={label} style={{ maxWidth: "12rem" }}>
            <label htmlFor={`night-${label}`}>{label}</label>
            <input
              id={`night-${label}`}
              type="number"
              min={0}
              max={16}
              step={0.5}
              inputMode="decimal"
              value={nights[index]}
              onChange={(event) => setNight(index, Number(event.target.value))}
            />
          </div>
        ))}
      </fieldset>

      <button className="button" type="button" onClick={onCalculate}>
        Show my sleep debt
      </button>

      {calculated ? (
        <div className="result-panel" aria-live="polite" style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
            {debt === 0 ? "No sleep debt this week" : `About ${Math.round(debt * 10) / 10} hours of sleep debt`}
          </p>
          <p style={{ marginBottom: 0 }}>
            {debt === 0
              ? "You're meeting your own sleep need — a consistent wake time is the best way to keep it that way."
              : "A consistent wake time and an earlier wind-down are the steadiest way to close the gap. If you're worried about your sleep, speak to your GP."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
