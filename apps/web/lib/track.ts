// WP3.1 — first-party conversion instrumentation. No third-party scripts.
// Events land in the same NDJSON sink as the waitlist until SVC wires the
// real event backbone (@preventos/events) behind an API.

export type WebEventName =
  | "waitlist_joined"
  | "savings_calculated"
  | "sleep_debt_calculated"
  | "programme_page_cta_clicked";

export function track(name: WebEventName, properties: Record<string, string | number> = {}): void {
  const body = JSON.stringify({ name, path: window.location.pathname, properties });
  if (navigator.sendBeacon?.("/api/events", body)) return;
  void fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => {
    // analytics must never break the page
  });
}
