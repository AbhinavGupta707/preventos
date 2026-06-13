import type { Metadata } from "next";
import { ARTICLES } from "../../lib/copy/articles";

export const metadata: Metadata = {
  title: "Learn",
  description: "Plain-English guides on smoking, vaping, alcohol units and sleep — no scare tactics, no overblown promises.",
};

const VERTICAL_LABEL: Record<string, string> = {
  smoking: "Smoking",
  vaping: "Vaping",
  alcohol: "Alcohol",
  sleep: "Sleep",
};

export default function LearnPage() {
  return (
    <section className="section">
      <div className="container">
        <h1>Learn</h1>
        <p className="prose">Short, honest reads on the habits we help with. No scare tactics, no overblown promises.</p>
        <ul className="card-grid">
          {ARTICLES.map((article) => (
            <li key={article.slug} className="card">
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)" }}>
                {VERTICAL_LABEL[article.vertical]}
              </p>
              <h2 style={{ fontSize: "1.2rem" }}>{article.title}</h2>
              <p>{article.description}</p>
              <a href={`/learn/${article.slug}`}>Read the guide</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
