import { pino } from "pino";
import { createDb } from "@preventos/db";
import { startLoops } from "./dispatcher.js";
import { DEFAULT_RULE_SET } from "./ruleset.js";

/** Boot entry: `pnpm --filter @preventos/worker dev`. */
const DATABASE_URL = process.env["DATABASE_URL"];
if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");

const logger = pino({ name: "preventos-worker" });
const { db, pool } = createDb(DATABASE_URL);
const loops = startLoops(db, pool, logger, { ruleSet: DEFAULT_RULE_SET });
logger.info("worker loops started");

const shutdown = () => {
  loops.stop();
  void pool.end().then(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
