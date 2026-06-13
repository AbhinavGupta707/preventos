"use client";

import type { FormEvent } from "react";
import { useAppStore, todayIso } from "../../../../lib/store/app-store";
import { sleepEntryMetrics } from "../../../../lib/diary/sleep-entry";
import { sleepEntrySchema } from "../../../../lib/store/types";

export default function SleepDiaryPage() {
  const { state, hydrated, update } = useAppStore();

  if (!hydrated) return <p>Loading…</p>;

  const today = todayIso();
  const todayDone = state.sleepDiary.some((entry) => entry.date === today);
  const recent = state.sleepDiary.slice(-7).reverse(); // reverse() on the fresh slice copy

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = sleepEntrySchema.safeParse({
      date: today,
      bedTime: String(data.get("bedTime")),
      getUpTime: String(data.get("getUpTime")),
      sleepDelayMin: Number(data.get("sleepDelayMin")),
      nightAwakeMin: Number(data.get("nightAwakeMin")),
    });
    if (!parsed.success) return;
    update((current) => ({
      ...current,
      sleepDiary: [...current.sleepDiary.filter((entry) => entry.date !== today), parsed.data],
    }));
  }

  return (
    <section className="section">
      <h1>Morning check-in</h1>
      {todayDone ? (
        <p className="notice" role="status">
          Done for today — see your week below.
        </p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="bedTime">When did you get into bed?</label>
            <input id="bedTime" name="bedTime" type="time" defaultValue="23:00" required />
          </div>
          <div className="field">
            <label htmlFor="sleepDelayMin">Roughly how long to fall asleep (minutes)?</label>
            <input id="sleepDelayMin" name="sleepDelayMin" type="number" min={0} max={600} defaultValue={15} required />
          </div>
          <div className="field">
            <label htmlFor="nightAwakeMin">Awake in the night for about (minutes)?</label>
            <input id="nightAwakeMin" name="nightAwakeMin" type="number" min={0} max={600} defaultValue={0} required />
          </div>
          <div className="field">
            <label htmlFor="getUpTime">When did you get up?</label>
            <input id="getUpTime" name="getUpTime" type="time" defaultValue="07:00" required />
          </div>
          <button className="button" type="submit">
            Save check-in
          </button>
        </form>
      )}

      {recent.length > 0 ? (
        <>
          <h2>Your last week</h2>
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time in bed</th>
                <th scope="col">Asleep</th>
                <th scope="col">Sleep efficiency</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((entry) => {
                const metrics = sleepEntryMetrics(entry);
                return (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{(metrics.minutesInBed / 60).toFixed(1)}h</td>
                    <td>{(metrics.minutesAsleep / 60).toFixed(1)}h</td>
                    <td>{metrics.efficiencyPercent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
