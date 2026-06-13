import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * SHA-256 hex of a UTF-8 string. Pure JS (no node:crypto) so it bundles
 * identically on Node services, the browser, and React Native / Metro —
 * the previous `node:crypto` import broke the mobile iOS bundle.
 *
 * Byte-identical to `createHash("sha256").update(input).digest("hex")`, so
 * already-pinned content-catalog hashes, rule-set policy versions, instrument
 * integrity hashes, and experiment assignments are unchanged (proven in tests).
 */
export function sha256Hex(input: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(input)));
}
