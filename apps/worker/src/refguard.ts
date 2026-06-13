import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCatalog, loadAllPacks } from "@preventos/content";
import type { RuleSet } from "@preventos/decisions";
import { VERTICALS } from "@preventos/domain";
import { OUTCOME_REF_IDS } from "@preventos/outcomes";

/** The id sets a rule-set action ref may resolve against. */
export interface RefUniverse {
  readonly atomIds: ReadonlySet<string>;
  readonly sequenceIds: ReadonlySet<string>;
  readonly outcomeIds: ReadonlySet<string>;
}

const VERTICAL_IDS: ReadonlySet<string> = new Set<string>(VERTICALS);

/**
 * Pure ref check: returns one human-readable error per rule whose action ref
 * does not resolve in `universe`; an empty array means every ref is backed.
 *
 * Ref semantics by action kind — all four rule-schema kinds are handled so no
 * ref can slip through unvalidated:
 *   send_atom             → a content atom id (catalog.byId)
 *   start_sequence        → a content sequence id (catalog.sequences)
 *   schedule_check_in     → a recognised outcome id (OUTCOME_REF_IDS)
 *   offer_cross_enrolment → the programme/vertical to cross-enrol into
 */
export function resolveRuleSetRefs(ruleSet: RuleSet, universe: RefUniverse): readonly string[] {
  const errors: string[] = [];
  for (const rule of ruleSet.rules) {
    const { kind, ref } = rule.then;
    const fail = (what: string): void => {
      errors.push(`rule "${rule.id}": ${kind} ref "${ref}" does not resolve to a known ${what}`);
    };
    switch (kind) {
      case "send_atom":
        if (!universe.atomIds.has(ref)) fail("content atom");
        break;
      case "start_sequence":
        if (!universe.sequenceIds.has(ref)) fail("content sequence");
        break;
      case "schedule_check_in":
        if (!universe.outcomeIds.has(ref)) fail("outcome definition");
        break;
      case "offer_cross_enrolment":
        if (!VERTICAL_IDS.has(ref)) fail("vertical");
        break;
    }
  }
  return errors;
}

const REPO_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

/** Content root the worker validates against — repo `content/` by default,
 *  overridable for deployments that ship content elsewhere. */
export function defaultContentRoot(): string {
  return process.env["PREVENTOS_CONTENT_ROOT"] ?? path.join(REPO_ROOT, "content");
}

/**
 * Loads the real content catalog and recognised outcome ids into a RefUniverse.
 * Throws if the content itself fails to load or form a consistent catalog — a
 * dangling rule-set ref is never the only thing that can stop the worker.
 */
export async function loadRefUniverse(contentRoot: string = defaultContentRoot()): Promise<RefUniverse> {
  const loaded = await loadAllPacks(contentRoot);
  if (loaded.errors.length > 0) {
    throw new Error(`content under ${contentRoot} failed to load:\n  - ${loaded.errors.join("\n  - ")}`);
  }
  const catalog = buildCatalog(loaded.atoms, loaded.sequences);
  if (!catalog.ok) throw new Error(`content catalog is inconsistent: ${catalog.error}`);
  return {
    atomIds: new Set(catalog.value.byId.keys()),
    sequenceIds: new Set(catalog.value.sequences.keys()),
    outcomeIds: OUTCOME_REF_IDS,
  };
}

/**
 * Boot/CI guard: throws if any rule in `ruleSet` references an atom, sequence,
 * outcome, or vertical that does not resolve against the live content catalog
 * and outcome registry. The worker calls this before starting its loops so a
 * dangling ref fails fast at boot instead of at the first decision tick.
 */
export async function assertRuleSetResolvable(
  ruleSet: RuleSet,
  contentRoot: string = defaultContentRoot(),
): Promise<void> {
  const errors = resolveRuleSetRefs(ruleSet, await loadRefUniverse(contentRoot));
  if (errors.length > 0) {
    throw new Error(
      `rule set "${ruleSet.version}" has ${errors.length} dangling ref(s):\n  - ${errors.join("\n  - ")}`,
    );
  }
}
