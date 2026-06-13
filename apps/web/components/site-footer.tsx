export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <ul>
          <li>
            <a href="/quitkit">QuitKit</a>
          </li>
          <li>
            <a href="/exhale">Exhale</a>
          </li>
          <li>
            <a href="/steady">Steady</a>
          </li>
          <li>
            <a href="/nightshift">Nightshift</a>
          </li>
          <li>
            <a href="/learn">Learn</a>
          </li>
          <li>
            <a href="/tools/savings-calculator">Savings calculator</a>
          </li>
          <li>
            <a href="/tools/sleep-debt">Sleep-debt calculator</a>
          </li>
        </ul>
        <p>
          PreventOS is a behaviour-change companion, not a medical service. If you're worried about your health, speak
          to your GP. In a crisis, call 999 or the Samaritans on 116 123.
        </p>
        <p>© {new Date().getFullYear()} PreventOS. All programme content is in draft and under clinical review.</p>
      </div>
    </footer>
  );
}
