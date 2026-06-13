export function SiteNav() {
  return (
    <header>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="site-nav" aria-label="Main">
        <div className="site-nav-inner">
          <a className="brand" href="/">
            PreventOS
          </a>
          <a href="/quitkit">QuitKit</a>
          <a href="/exhale">Exhale</a>
          <a href="/steady">Steady</a>
          <a href="/nightshift">Nightshift</a>
          <a href="/learn">Learn</a>
          <a href="/app">Open the app</a>
          <a className="cta" href="/#waitlist">
            Join the waitlist
          </a>
        </div>
      </nav>
    </header>
  );
}
