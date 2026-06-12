import { getEvidenceSummary } from "../../lib/evidence";

const th = { textAlign: "left" as const, padding: "8px 12px", borderBottom: "2px solid #ddd" };
const td = { padding: "8px 12px", borderBottom: "1px solid #eee" };

export default function EvidencePage() {
  const summary = getEvidenceSummary();

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontWeight: 500 }}>Evidence</h1>
      <p style={{ color: "#666" }}>
        Synthetic fixture cohort (50 journeys) — outcome definitions are versioned and pinned by
        content hash. Aggregates with fewer than {summary.k} people are suppressed server-side.
      </p>

      <h2 style={{ fontWeight: 500, fontSize: 18 }}>Primary outcomes</h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>Outcome</th>
            <th style={th}>Value</th>
            <th style={th}>n</th>
            <th style={th}>Definition</th>
          </tr>
        </thead>
        <tbody>
          {summary.headlines.map((h) => (
            <tr key={h.definitionRef + h.label}>
              <td style={td}>{h.label}</td>
              <td style={td}>{h.value}</td>
              <td style={td}>{h.n}</td>
              <td style={{ ...td, fontFamily: "monospace", fontSize: 12 }}>{h.definitionRef}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontWeight: 500, fontSize: 18, marginTop: 32 }}>
        Groups (vertical × age band)
      </h2>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={th}>Group</th>
            <th style={th}>People</th>
            <th style={th}>Headline metric</th>
          </tr>
        </thead>
        <tbody>
          {summary.groups.map((g) => (
            <tr key={g.key}>
              <td style={{ ...td, fontFamily: "monospace", fontSize: 13 }}>{g.key}</td>
              <td style={td} data-group-count={g.count}>
                {g.count}
              </td>
              <td style={td}>
                {g.headline.label}: {g.headline.value.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {summary.suppressedGroupCount > 0 ? (
        <p style={{ color: "#666", fontSize: 13 }}>
          {summary.suppressedGroupCount} group(s) suppressed (fewer than {summary.k} people).
        </p>
      ) : null}
    </main>
  );
}
