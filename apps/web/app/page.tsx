import { PROGRAMMES } from "../lib/copy/programmes";
import { WaitlistForm } from "../components/waitlist-form";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Four programmes. One coach.</h1>
          <p>
            Quit smoking, step down vaping, drink less, sleep better — in one app that coordinates everything it asks
            of you, so support never becomes noise.
          </p>
          <a className="button" href="#waitlist">
            Join the waitlist
          </a>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="programmes-heading">
        <div className="container">
          <h2 id="programmes-heading">Pick your programme</h2>
          <ul className="card-grid">
            {PROGRAMMES.map((programme) => (
              <li key={programme.slug} className="card" style={{ ["--card-accent" as string]: `var(${programme.accentVar})` }}>
                <h3>{programme.name}</h3>
                <p>{programme.headline}</p>
                <a href={`/${programme.slug}`}>About {programme.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="how-heading">
        <div className="container prose">
          <h2 id="how-heading">One budget for your attention</h2>
          <p>
            Most health apps compete for your attention. PreventOS programmes share one coach with one daily budget of
            check-ins and nudges — at most a few a day across everything you're working on, never late at night.
          </p>
          <p>
            Everything is built on behaviour-change techniques with a real evidence base, reviewed by clinicians before
            it reaches you, and honest about what it is: a companion for everyday habits, not a medical service.
          </p>
        </div>
      </section>

      <section className="section section-alt" id="waitlist" aria-labelledby="waitlist-heading">
        <div className="container">
          <h2 id="waitlist-heading">Be first in</h2>
          <p className="prose">
            We're opening programmes gradually. Leave your email and we'll tell you when yours is ready.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </>
  );
}
