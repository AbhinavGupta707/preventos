import type { Metadata } from "next";
import { SavingsCalculator } from "../../../components/savings-calculator";

export const metadata: Metadata = {
  title: "Savings calculator",
  description: "Work out what smoking, vaping or drinking is costing you per week, month and year.",
};

export default function SavingsCalculatorPage() {
  return (
    <section className="section">
      <div className="container">
        <h1>What's the habit costing you?</h1>
        <p className="prose">
          Put in your real numbers — your actual daily count, your actual prices — and see what cutting back keeps in
          your pocket.
        </p>
        <SavingsCalculator />
        <p className="prose" style={{ marginTop: "2rem" }}>
          Ready to make the number real? <a href="/#waitlist">Join the waitlist</a> or read{" "}
          <a href="/learn/what-smoking-costs">what smoking really costs</a>.
        </p>
      </div>
    </section>
  );
}
