"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useAppStore, todayIso } from "../../../../lib/store/app-store";
import { requestSleepWindow, syncApp } from "../../../../lib/sync";
import { sleepEntryMetrics } from "../../../../lib/diary/sleep-entry";
import { sleepEntrySchema } from "../../../../lib/store/types";
import { programmeAccess } from "../../../../lib/programme-access";

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export default function SleepDiaryPage() {
  const { state, hydrated, update } = useAppStore();
  const [windowStatus, setWindowStatus] = useState<string | null>(null);
  const [windowPending, setWindowPending] = useState(false);

  if (programmeAccess("nightshift") === "gated") {
    return (
      <section className="section">
        <h1>Nightshift is internal right now</h1>
        <p className="notice">
          The sleep diary and sleep-window tools are limited while the safety constants and claims posture are reviewed.
          You can still use QuitKit and Exhale in this beta.
        </p>
      </section>
    );
  }

  if (!hydrated) return <p>Loading…</p>;

  const today = todayIso();
  const todayDone = state.sleepDiary.some((entry) => entry.date === today);
  const recent = state.sleepDiary.slice(-7).reverse(); // reverse() on the fresh slice copy
  const enoughDiaryForWindow = state.sleepDiary.length >= 5;
  const defaultRiseTime = state.sleepDiary.at(-1)?.getUpTime ?? "07:00";

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
    syncApp({ action: "sleep", ...parsed.data });
  }

  async function onWindowSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setWindowPending(true);
    setWindowStatus(null);
    const result = await requestSleepWindow({
      action: "sleepWindow",
      desiredRiseTime: String(data.get("desiredRiseTime")),
      effectiveFrom: today,
      safetySensitiveOccupation: data.get("safetySensitiveOccupation") === "on",
      excessiveDaytimeSleepiness: data.get("excessiveDaytimeSleepiness") === "on",
    });
    setWindowPending(false);
    if (result.sleepWindow !== undefined) {
      update((current) => ({ ...current, sleepWindow: result.sleepWindow }));
      setWindowStatus("Sleep window updated.");
      return;
    }
    setWindowStatus(result.error ?? "Connect the API to calculate the sleep window. Your diary is saved on this device.");
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

      <h2>Your sleep window</h2>
      {state.sleepWindow !== undefined ? (
        <dl className="result-panel">
          <dt>Window</dt>
          <dd>
            {state.sleepWindow.windowStart} to {state.sleepWindow.windowEnd}
          </dd>
          <dt>Time in bed</dt>
          <dd>{durationLabel(state.sleepWindow.durationMin)}</dd>
          {state.sleepWindow.signpostRequired ? (
            <p>
              A more cautious window was used because of safety flags. If sleepiness is affecting driving, work, or
              daily life, speak to a clinician.
            </p>
          ) : null}
        </dl>
      ) : (
        <p className="notice">
          {enoughDiaryForWindow
            ? "You have enough diary entries to request your first sleep window."
            : `Save ${5 - state.sleepDiary.length} more check-in${5 - state.sleepDiary.length === 1 ? "" : "s"} to request your first sleep window.`}
        </p>
      )}

      {enoughDiaryForWindow ? (
        <form onSubmit={onWindowSubmit}>
          <div className="field">
            <label htmlFor="desiredRiseTime">Target get-up time</label>
            <input id="desiredRiseTime" name="desiredRiseTime" type="time" defaultValue={defaultRiseTime} required />
          </div>
          <div className="field field-checkbox">
            <label>
              <input name="safetySensitiveOccupation" type="checkbox" /> I drive, operate machinery, or do
              safety-sensitive work
            </label>
          </div>
          <div className="field field-checkbox">
            <label>
              <input name="excessiveDaytimeSleepiness" type="checkbox" /> I am very sleepy during the day
            </label>
          </div>
          <button className="button" type="submit" disabled={windowPending}>
            {windowPending ? "Updating…" : "Update sleep window"}
          </button>
          {windowStatus !== null ? (
            <p className="notice" role="status">
              {windowStatus}
            </p>
          ) : null}
        </form>
      ) : null}

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
