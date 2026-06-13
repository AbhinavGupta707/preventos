import type { Metadata } from "next";
import { SleepDebtCalculator } from "../../../components/sleep-debt-calculator";

export const metadata: Metadata = {
  title: "Sleep-debt calculator",
  description: "Estimate the gap between the sleep you need and the sleep you got over the last week.",
};

export default function SleepDebtPage() {
  return (
    <section className="section">
      <div className="container">
        <h1>How much sleep are you owed?</h1>
        <p className="prose">
          Sleep debt is the running gap between the sleep you need and the sleep you get. Estimate yours from the last
          seven nights.
        </p>
        <SleepDebtCalculator />
        <p className="prose" style={{ marginTop: "2rem" }}>
          Want a steadier week? <a href="/nightshift">See how Nightshift works</a> or read{" "}
          <a href="/learn/what-is-sleep-debt">what sleep debt actually is</a>.
        </p>
      </div>
    </section>
  );
}
