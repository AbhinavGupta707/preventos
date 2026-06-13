import { EVENT_TYPES, type DispatchableEvent, type EventHandler, type EventType } from "@preventos/events";

export interface AuditLogger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
}

/** Safety- and erasure-relevant topics log at WARN so alerting/paging hooks
 *  can subscribe to a single stream. */
const ALERT_EVENTS: ReadonlySet<EventType> = new Set([
  "escalation.opened",
  "escalation.closed",
  "person.erased",
]);

/**
 * The event backbone's first consumer (plan WP9.2 — clinical audit trail /
 * observability). Without a registered handler the outbox dispatcher runs as a
 * no-op and every event is write-only; registering this map makes events
 * genuinely consumed exactly once. Payloads carry coded ids only (the erasure
 * invariant forbids free text / direct identifiers), so projecting them onto
 * the audit stream leaks nothing.
 */
export function makeAuditHandlers(logger: AuditLogger): Partial<Record<EventType, EventHandler>> {
  const audit: EventHandler = (event: DispatchableEvent): Promise<void> => {
    const line = {
      eventId: event.eventId.toString(),
      type: event.type,
      ...(event.personId !== undefined ? { personId: event.personId } : {}),
      occurredAt: event.occurredAt.toISOString(),
      payload: event.payload,
    };
    if (ALERT_EVENTS.has(event.type)) logger.warn(line, "audit-event");
    else logger.info(line, "audit-event");
    return Promise.resolve();
  };
  return Object.fromEntries(EVENT_TYPES.map((type) => [type, audit])) as Partial<
    Record<EventType, EventHandler>
  >;
}
