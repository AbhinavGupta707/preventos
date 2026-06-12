import type { ProgrammeCopy } from "../lib/copy/programmes";

export function ProgrammeLanding({ programme }: { programme: ProgrammeCopy }) {
  return (
    <>
      <section className="hero" style={{ borderTop: `6px solid var(${programme.accentVar})` }}>
        <div className="container">
          <h1>{programme.headline}</h1>
          <p>{programme.subhead}</p>
          <a className="button" href="/#waitlist">
            Join the waitlist
          </a>{" "}
          {programme.toolHref ? (
            <a className="button button-quiet" href={programme.toolHref}>
              {programme.toolLabel}
            </a>
          ) : null}
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="what-you-get">
        <div className="container">
          <h2 id="what-you-get">What {programme.name} gives you</h2>
          <ul className="card-grid">
            {programme.bullets.map((bullet) => (
              <li key={bullet} className="card" style={{ ["--card-accent" as string]: `var(${programme.accentVar})` }}>
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="honest-bit">
        <div className="container prose">
          <h2 id="honest-bit">The honest bit</h2>
          <p className="notice">{programme.signpost}</p>
        </div>
      </section>
    </>
  );
}
