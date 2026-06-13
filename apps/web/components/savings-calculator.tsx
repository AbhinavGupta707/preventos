"use client";

import { useState } from "react";
import {
  alcoholDailySpend,
  projectSavings,
  smokingDailySpend,
  vapingDailySpend,
} from "../lib/calculators/savings";
import { track } from "../lib/track";

type Habit = "smoking" | "vaping" | "alcohol";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

export function SavingsCalculator() {
  const [habit, setHabit] = useState<Habit>("smoking");
  const [cigarettesPerDay, setCigarettesPerDay] = useState(10);
  const [pricePerPack, setPricePerPack] = useState(15);
  const [weeklyVapeSpend, setWeeklyVapeSpend] = useState(15);
  const [drinksPerWeek, setDrinksPerWeek] = useState(10);
  const [pricePerDrink, setPricePerDrink] = useState(5);
  const [calculated, setCalculated] = useState(false);

  const dailySpend =
    habit === "smoking"
      ? smokingDailySpend({ cigarettesPerDay, pricePerPack, cigarettesPerPack: 20 })
      : habit === "vaping"
        ? vapingDailySpend({ weeklySpend: weeklyVapeSpend })
        : alcoholDailySpend({ drinksPerWeek, pricePerDrink });
  const projection = projectSavings(dailySpend);

  function onCalculate() {
    setCalculated(true);
    track("savings_calculated", { habit, perYear: Math.round(projection.perYear) });
  }

  const numberField = (
    id: string,
    label: string,
    value: number,
    onChange: (next: number) => void,
  ) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );

  return (
    <div>
      <div className="field">
        <label htmlFor="habit">What are you cutting back?</label>
        <select id="habit" value={habit} onChange={(event) => setHabit(event.target.value as Habit)}>
          <option value="smoking">Smoking</option>
          <option value="vaping">Vaping</option>
          <option value="alcohol">Alcohol</option>
        </select>
      </div>

      {habit === "smoking" ? (
        <>
          {numberField("cigs-per-day", "Cigarettes per day", cigarettesPerDay, setCigarettesPerDay)}
          {numberField("price-per-pack", "Price per pack of 20 (£)", pricePerPack, setPricePerPack)}
        </>
      ) : null}
      {habit === "vaping" ? numberField("vape-spend", "Weekly spend on vaping (£)", weeklyVapeSpend, setWeeklyVapeSpend) : null}
      {habit === "alcohol" ? (
        <>
          {numberField("drinks-per-week", "Drinks in a typical week", drinksPerWeek, setDrinksPerWeek)}
          {numberField("price-per-drink", "Average price per drink (£)", pricePerDrink, setPricePerDrink)}
        </>
      ) : null}

      <button className="button" type="button" onClick={onCalculate}>
        Show my savings
      </button>

      {calculated ? (
        <dl className="result-panel" aria-live="polite" style={{ marginTop: "1.5rem" }}>
          <dt>Per week</dt>
          <dd>{gbp.format(projection.perWeek)}</dd>
          <dt>Per month</dt>
          <dd>{gbp.format(projection.perMonth)}</dd>
          <dt>Per year</dt>
          <dd>{gbp.format(projection.perYear)}</dd>
        </dl>
      ) : null}
    </div>
  );
}
