import type { FastifyInstance } from "fastify";
import type pg from "pg";
import { erasePerson, exportPersonData } from "@preventos/consent";
import type { Db } from "@preventos/db";
import type { PersonId } from "@preventos/domain";

export interface DataRightsHandle {
  readonly db: Db;
  readonly pool: pg.Pool;
}

/** Authenticated account data-rights routes. The person id comes only from AuthPort. */
export function registerDataRightsRoutes(app: FastifyInstance, handle: DataRightsHandle): void {
  app.get("/me/export", async (request, reply) => {
    const bundle = await exportPersonData(handle.pool, request.personId as PersonId);
    return reply
      .header("content-type", "application/json; charset=utf-8")
      .header("content-disposition", 'attachment; filename="preventos-my-data.json"')
      .send({ data: bundle });
  });

  app.delete("/me", async (request, reply) => {
    await erasePerson(handle, request.personId as PersonId);
    return reply.code(204).send();
  });
}
