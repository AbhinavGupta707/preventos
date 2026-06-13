"use client";

// WP W3-WIRE — best-effort client → /api/app sync. Fire-and-forget so app
// flows stay snappy and local-first; failures never surface to the user.
import type { SyncAction } from "./sync-schema";

export function syncApp(action: SyncAction): void {
  void fetch("/api/app", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(action),
    keepalive: true,
  }).catch(() => {
    // local-first: sync is opportunistic, never blocks the UI
  });
}
