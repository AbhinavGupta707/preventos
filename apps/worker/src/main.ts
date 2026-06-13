import { fileURLToPath } from "node:url";
import { pino } from "pino";
import { buildCatalog, loadAllPacks } from "@preventos/content";
import { createDb } from "@preventos/db";
import { startLoops } from "./dispatcher.js";
import { DEFAULT_RULE_SET } from "./ruleset.js";

/** Boot entry: `pnpm --filter @preventos/worker dev`. */
const DATABASE_URL = process.env["DATABASE_URL"];
if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");

const logger = pino({ name: "preventos-worker" });

// Invariant 4: the contraindication gate needs the content catalog to resolve an
// atom's contraindications at contact-send. Fail closed — a worker that cannot
// load the catalog must not run the tick, or a moderation atom could leak to a
// dependence-flagged person.
const contentRoot = process.env["CONTENT_ROOT"] ?? fileURLToPath(new URL("../../../content", import.meta.url));
const loaded = await loadAllPacks(contentRoot);
if (loaded.errors.length > 0) throw new Error(`content load failed: ${loaded.errors.join("; ")}`);
const catalogResult = buildCatalog(loaded.atoms, loaded.sequences);
if (!catalogResult.ok) throw new Error(`content catalog invalid: ${catalogResult.error}`);
const catalog = catalogResult.value;
if (catalog.byId.size === 0) {
  throw new Error(`content catalog empty at ${contentRoot} — refusing to run the contraindication gate blind`);
}
const atomFor = (atomId: string) => catalog.byId.get(atomId);

const { db, pool } = createDb(DATABASE_URL);
const loops = startLoops(db, pool, logger, { ruleSet: DEFAULT_RULE_SET, atomFor });
logger.info({ atoms: catalog.byId.size }, "worker loops started");

const shutdown = () => {
  loops.stop();
  void pool.end().then(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
