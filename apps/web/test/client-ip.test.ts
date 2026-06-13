import { describe, expect, it } from "vitest";
import { clientIpForRateLimit } from "../lib/client-ip";

// W3-SECHARD — the rate-limit key must derive from a TRUSTED source. An
// attacker controls everything to the LEFT of the IP our own proxy appends, so
// the leftmost X-Forwarded-For entries are spoofable and must never form the key.
describe("clientIpForRateLimit", () => {
  it("behind one trusted proxy, uses the IP the proxy appended (the real client)", () => {
    expect(clientIpForRateLimit("198.51.100.7", 1)).toBe("198.51.100.7");
    // client forged a leftmost entry; the proxy appended the real one
    expect(clientIpForRateLimit("1.2.3.4, 198.51.100.7", 1)).toBe("198.51.100.7");
  });

  it("is spoof-resistant: varying the forged leftmost entries never changes the key", () => {
    const a = clientIpForRateLimit("1.1.1.1, 198.51.100.7", 1);
    const b = clientIpForRateLimit("2.2.2.2, 198.51.100.7", 1);
    const c = clientIpForRateLimit("9.9.9.9, 8.8.8.8, 7.7.7.7, 198.51.100.7", 1);
    expect(a).toBe("198.51.100.7");
    expect(b).toBe("198.51.100.7");
    expect(c).toBe("198.51.100.7"); // extra left-padding cannot shift the slot
    expect(new Set([a, b, c]).size).toBe(1); // all land in one bucket
  });

  it("honours a multi-hop trusted chain (real client is N entries from the right)", () => {
    // client -> P1 -> P2 -> app : P1 appends client, P2 appends P1
    expect(clientIpForRateLimit("forged, 198.51.100.7, 10.0.0.1", 2)).toBe("198.51.100.7");
  });

  it("falls back to a shared bucket when X-Forwarded-For is absent", () => {
    expect(clientIpForRateLimit(null, 1)).toBe("unknown");
    expect(clientIpForRateLimit("", 1)).toBe("unknown");
  });

  it("refuses to trust X-Forwarded-For at all when no trusted proxy is configured", () => {
    expect(clientIpForRateLimit("203.0.113.9", 0)).toBe("untrusted");
    expect(clientIpForRateLimit("203.0.113.9", -1)).toBe("untrusted");
  });

  it("buckets unparseable values together instead of letting them key arbitrary data", () => {
    expect(clientIpForRateLimit("not-an-ip", 1)).toBe("unparseable");
    expect(clientIpForRateLimit("<script>alert(1)</script>", 1)).toBe("unparseable");
  });

  it("accepts IPv6 in the trusted slot", () => {
    expect(clientIpForRateLimit("2001:db8::1", 1)).toBe("2001:db8::1");
  });
});
