// W3-SECHARD — derive a rate-limit key from a TRUSTED source.
//
// X-Forwarded-For is `clientClaimed, ipSeenByProxy1, ipSeenByProxy2, …`: each
// proxy appends, to the RIGHT, the address it actually received the request
// from. Everything to the LEFT of our own infrastructure's entries is
// attacker-controlled. Trusting the leftmost entry (the old `split(",")[0]`)
// lets a client forge a fresh IP per request and walk straight past the limiter.
//
// So we count `trustedProxyHops` entries in from the right — the real client IP
// sits exactly that many hops from the end, and no amount of left-padding can
// shift it out of that slot.

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6 = /^[0-9a-fA-F:]+$/;

function isPlausibleIp(value: string): boolean {
  if (value.length > 45) return false; // max length of a textual IPv6 address
  return IPV4.test(value) || (value.includes(":") && IPV6.test(value));
}

/**
 * Rate-limit key for a request, resilient to X-Forwarded-For spoofing.
 *
 * @param forwardedFor raw `x-forwarded-for` header value (or null if absent)
 * @param trustedProxyHops number of trusted reverse proxies / CDN edges in
 *   front of the app. 0 (or fewer) means "no trusted proxy" — XFF is then
 *   entirely client-controlled and is ignored in favour of one shared bucket.
 */
export function clientIpForRateLimit(forwardedFor: string | null, trustedProxyHops: number): string {
  if (trustedProxyHops < 1) return "untrusted";
  if (forwardedFor === null) return "unknown";

  const hops = forwardedFor
    .split(",")
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0);
  if (hops.length === 0) return "unknown";

  // index = hops.length - trustedProxyHops, clamped into range. With ≥1 trusted
  // hop this is always a valid index, and extra forged left-entries grow both
  // hops.length and the index in lock-step, so the real client IP stays put.
  const index = Math.max(0, hops.length - trustedProxyHops);
  const candidate = hops[index] ?? "";
  return isPlausibleIp(candidate) ? candidate : "unparseable";
}
