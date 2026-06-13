"use client";

import { useAppStore, todayIso } from "../../lib/store/app-store";
import { projectSavings } from "../../lib/calculators/savings";
import { dayUnits, lastSevenDates, weekSummary } from "../../lib/diary/drinks";
import { sleepEntryMetrics } from "../../lib/diary/sleep-entry";

const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(`${isoDate}T00:00:00`).getTime();
  return Math.max(Math.floor(ms / 86_400_000), 0);
}

export default function TodayPage() {
  const { state, hydrated } = useAppStore();

  if (!hydrated) return <p>Loading your day…</p>;

  if (!state.onboarded) {
    return (
      <section className="section">
        <h1>Welcome</h1>
        <p className="prose">Set up your programmes to see your day here.</p>
        <a className="button" href="/app/onboarding">
          Get set up
        </a>
      </section>
    );
  }

  const today = todayIso();
  const quitting = state.programmes.includes("quitkit") || state.programmes.includes("exhale");
  const smokeFreeDays = state.quitDate ? daysSince(state.quitDate) : 0;
  const saved = state.dailySpendGbp ? projectSavings(state.dailySpendGbp).perDay * smokeFreeDays : 0;
  const latestSleep = state.sleepDiary.at(-1);
  const drinksToday = dayUnits(state.drinkLog, today);
  const week = weekSummary(state.drinkLog, lastSevenDates());

  return (
    <section className="section">
      <h1>Today</h1>
      <ul className="card-grid">
        {quitting ? (
          <li className="card" style={{ ["--card-accent" as string]: "var(--quitkit)" }}>
            <h2>Quit streak</h2>
            <p style={{ fontSize: "1.6rem", fontWeight: 700 }}>
              {state.quitDate ? `${smokeFreeDays} day${smokeFreeDays === 1 ? "" : "s"}` : "Set your quit date"}
            </p>
            {saved > 0 ? <p>About {gbp.format(saved)} kept in your pocket so far.</p> : null}
          </li>
        ) : null}
        {state.programmes.includes("nightshift") ? (
          <li className="card" style={{ ["--card-accent" as string]: "var(--nightshift)" }}>
            <h2>Sleep</h2>
            {latestSleep ? (
              <p>
                Last night: {sleepEntryMetrics(latestSleep).efficiencyPercent}% of your time in bed asleep.{" "}
                <a href="/app/diary/sleep">Morning check-in</a>
              </p>
            ) : (
              <p>
                No entries yet. <a href="/app/diary/sleep">Do your first morning check-in</a> — it takes four taps.
              </p>
            )}
          </li>
        ) : null}
        {state.programmes.includes("steady") ? (
          <li className="card" style={{ ["--card-accent" as string]: "var(--steady)" }}>
            <h2>Drinks</h2>
            <p>
              Today: {drinksToday.toFixed(1)} units. This week: {week.totalUnits.toFixed(1)} units,{" "}
              {week.drinkFreeDays} drink-free day{week.drinkFreeDays === 1 ? "" : "s"}.
            </p>
            <a href="/app/drinks">Open the drink log</a>
          </li>
        ) : null}
      </ul>
      <p className="prose" style={{ marginTop: "1.5rem" }}>
        <a href="/app/onboarding">Change programmes</a>
      </p>
    </section>
  );
}
