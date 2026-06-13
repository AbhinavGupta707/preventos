import { getEvidenceSummary } from "../../lib/evidence";
import { getMarketingFunnel } from "../../lib/marketing";
import { getOperationalSummary } from "../../lib/operational";

const th = { textAlign: "left" as const, padding: "8px 12px", borderBottom: "2px solid #ddd" };
const td = { padding: "8px 12px", borderBottom: "1px solid #eee" };

const PROGRAMME_LABELS: Record<string, string> = {
  quitkit: "QuitKit (smoking)",
  exhale: "Exhale (vaping)",
  steady: "Steady (alcohol)",
  nightshift: "Nightshift (sleep)",
  unsure: "Unsure / browsing",
};

// Reads the live event backbone at request time — never prerendered.
export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const summary = getEvidenceSummary();
  const live = await getOperationalSummary();
  const funnel = await getMarketingFunnel();

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontWeight: 500 }}>Evidence</h1>

      <h2 style={{ fontWeight: 500, fontSize: 18 }}>Live platform activity</h2>
      {!live.configured ? (
        <p style={{ color: "#666" }}>No database configured — set DATABASE_URL to read live activity.</p>
      ) : live.error !== undefined ? (
        <p style={{ color: "#a00" }}>Database unreachable: {live.error}</p>
      ) : (
        <>
          <p style={{ color: "#666" }}>
            Read live from the real event backbone and core tables (counts of coded rows; no
            per-person data). {live.people} {live.people === 1 ? "person" : "people"} ·{" "}
            {live.decisions.total} decisions ({live.decisions.sent} sent / {live.decisions.suppressed}{" "}
            suppressed) · {live.contacts.outboundQueued + live.contacts.outboundSent} outbound +{" "}
            {live.contacts.inbound} inbound contacts · {live.openEscalations} open escalation(s).
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Active enrolments</th>
                <th style={th}>People</th>
              </tr>
            </thead>
            <tbody>
              {live.activeEnrolments.length === 0 ? (
                <tr>
                  <td style={td} colSpan={2}>
                    No active enrolments yet.
                  </td>
                </tr>
              ) : (
                live.activeEnrolments.map((row) => (
                  <tr key={row.vertical}>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 13 }}>{row.vertical}</td>
                    <td style={td} data-enrolment-count={row.count}>
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th style={th}>Event type</th>
                <th style={th}>Count</th>
              </tr>
            </thead>
            <tbody>
              {live.eventsByType.length === 0 ? (
                <tr>
                  <td style={td} colSpan={2}>
                    No events recorded yet.
                  </td>
                </tr>
              ) : (
                live.eventsByType.map((row) => (
                  <tr key={row.type}>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 13 }}>{row.type}</td>
                    <td style={td} data-event-count={row.count}>
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ fontWeight: 500, fontSize: 18, marginTop: 32 }}>Marketing funnel</h2>
      {!funnel.configured ? (
        <p style={{ color: "#666" }}>No database configured — set DATABASE_URL to read the funnel.</p>
      ) : funnel.error !== undefined ? (
        <p style={{ color: "#a00" }}>Marketing schema unreachable: {funnel.error}</p>
      ) : (
        <>
          <p style={{ color: "#666" }}>
            First-party waitlist + conversion counts from the isolated{" "}
            <code>marketing</code> schema (coded aggregates only — no email, no per-lead
            data, never joined to clinical records). {funnel.waitlistTotal} total waitlist{" "}
            {funnel.waitlistTotal === 1 ? "signup" : "signups"}.
          </p>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Waitlist by programme</th>
                <th style={th}>Signups</th>
              </tr>
            </thead>
            <tbody>
              {funnel.waitlist.length === 0 ? (
                <tr>
                  <td style={td} colSpan={2}>
                    No waitlist signups yet.
                  </td>
                </tr>
              ) : (
                funnel.waitlist.map((row) => (
                  <tr key={row.programme}>
                    <td style={td}>{PROGRAMME_LABELS[row.programme] ?? row.programme}</td>
                    <td style={td} data-waitlist-programme={row.programme} data-waitlist-count={row.count}>
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 16 }}>
            <thead>
              <tr>
                <th style={th}>Conversion event</th>
                <th style={th}>Count</th>
              </tr>
            </thead>
            <tbody>
              {funnel.events.length === 0 ? (
                <tr>
                  <td style={td} colSpan={2}>
                    No conversion events yet.
                  </td>
                </tr>
              ) : (
                funnel.events.map((row) => (
                  <tr key={row.name}>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 13 }}>{row.name}</td>
                    <td style={td} data-funnel-event={row.name} data-funnel-count={row.count}>
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      <h2 style={{ fontWeight: 500, fontSize: 18, marginTop: 32 }}>Outcome trajectories</h2>
      <p style={{ color: "#666" }}>
        Synthetic fixture cohort (50 journeys) — shown until live journeys mature enough to compute
        real outcomes. Outcome definitions are versioned and pinned by content hash. Aggregates with
        fewer than {summary.k} people are suppressed server-side.
      </p>

      <h3 style={{ fontWeight: 500, fontSize: 16 }}>Primary outcomes</h3>
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
