import type { Db } from "@preventos/db";
import { schema } from "@preventos/db";
import type { EventPayload, EventType } from "./catalogue.js";
import { EVENT_SCHEMAS } from "./catalogue.js";

export interface PublishedEvent {
  readonly eventId: bigint;
  readonly outboxId: bigint;
}

/**
 * Validates the payload against the catalogue, then writes the event and its
 * outbox row in ONE transaction — an event either exists with its dispatch
 * intent or not at all.
 */
export async function publish<T extends EventType>(
  db: Db,
  type: T,
  payload: EventPayload<T>,
): Promise<PublishedEvent> {
  const parsed = EVENT_SCHEMAS[type].parse(payload);
  const personId = (parsed as { personId?: string }).personId;
  return db.transaction(async (tx) => {
    const [eventRow] = await tx
      .insert(schema.event)
      .values({ type, personId: personId ?? null, payload: parsed })
      .returning({ id: schema.event.id });
    if (eventRow === undefined) throw new Error("event insert returned no row");
    const [outboxRow] = await tx
      .insert(schema.outbox)
      .values({ eventId: eventRow.id, topic: type })
      .returning({ id: schema.outbox.id });
    if (outboxRow === undefined) throw new Error("outbox insert returned no row");
    return { eventId: eventRow.id, outboxId: outboxRow.id };
  });
}
