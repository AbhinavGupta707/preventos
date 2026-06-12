import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Your programmes",
  robots: { index: false },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container">
      <nav aria-label="App sections" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "1rem 0" }}>
        <a href="/app">Today</a>
        <a href="/app/diary/sleep">Sleep diary</a>
        <a href="/app/drinks">Drink log</a>
        <a href="/app/consent">Privacy &amp; consent</a>
      </nav>
      {children}
    </div>
  );
}
