type Clock = () => number;

export type FixedWindowRateLimiter = {
  isRateLimited: (key: string) => boolean;
  size: () => number;
};

type Entry = {
  readonly count: number;
  readonly windowStart: number;
  readonly lastSeen: number;
};

type FixedWindowOptions = {
  readonly windowMs: number;
  readonly maxPerWindow: number;
  readonly maxBuckets: number;
  readonly clock?: Clock;
};

function oldestKey(entries: ReadonlyMap<string, Entry>): string | undefined {
  let key: string | undefined;
  let oldest = Number.POSITIVE_INFINITY;
  for (const [candidate, entry] of entries) {
    if (entry.lastSeen < oldest) {
      key = candidate;
      oldest = entry.lastSeen;
    }
  }
  return key;
}

export function createFixedWindowRateLimiter(options: FixedWindowOptions): FixedWindowRateLimiter {
  const clock = options.clock ?? Date.now;
  const entries = new Map<string, Entry>();

  function pruneExpired(now: number): void {
    for (const [key, entry] of entries) {
      if (now - entry.windowStart > options.windowMs) entries.delete(key);
    }
  }

  function ensureCapacity(now: number, incomingKey: string): void {
    if (entries.has(incomingKey) || entries.size < options.maxBuckets) return;
    pruneExpired(now);
    while (entries.size >= options.maxBuckets) {
      const key = oldestKey(entries);
      if (key === undefined) return;
      entries.delete(key);
    }
  }

  return {
    isRateLimited(key: string): boolean {
      const now = clock();
      const current = entries.get(key);

      if (current === undefined || now - current.windowStart > options.windowMs) {
        ensureCapacity(now, key);
        entries.set(key, { count: 1, windowStart: now, lastSeen: now });
        return false;
      }

      const count = current.count + 1;
      entries.set(key, { ...current, count, lastSeen: now });
      return count > options.maxPerWindow;
    },

    size(): number {
      pruneExpired(clock());
      return entries.size;
    },
  };
}
