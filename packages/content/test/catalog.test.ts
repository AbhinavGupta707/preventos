import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertServable, buildCatalog, isContraindicated, renderAtom, resolveAtom } from "../src/catalog.js";
import { loadPackDir } from "../src/load.js";

const FIXTURE_PACK = path.join(fileURLToPath(new URL("./fixtures", import.meta.url)), "smoking");

async function fixtureCatalog() {
  const loaded = await loadPackDir(FIXTURE_PACK);
  expect(loaded.errors).toEqual([]);
  const catalog = buildCatalog(loaded.atoms, loaded.sequences);
  if (!catalog.ok) throw new Error(catalog.error);
  return catalog.value;
}

describe("catalog", () => {
  it("loads the drafted-shape fixture pack without errors and is deterministic", async () => {
    const first = await fixtureCatalog();
    const second = await fixtureCatalog();
    expect(first.byId.size).toBe(3);
    expect(first.sequences.size).toBe(1);
    expect(first.hash).toBe(second.hash);
  });

  it("rejects duplicate atom ids and sequences referencing unknown atoms", async () => {
    const { atoms } = await loadPackDir(FIXTURE_PACK);
    const dup = buildCatalog([...atoms, ...atoms.slice(0, 1)]);
    expect(dup.ok).toBe(false);
    const badSeq = buildCatalog(atoms, [{ id: "smoking.seq.bad", steps: [{ atom: "smoking.does.not-exist" }] }]);
    expect(badSeq.ok).toBe(false);
  });

  it("renders channel variants, falls back to body, and enforces slot values", async () => {
    const catalog = await fixtureCatalog();
    const atom = resolveAtom(catalog, "smoking.lapse.streak-repair");
    expect(atom.ok).toBe(true);
    if (!atom.ok) return;
    const push = renderAtom(atom.value, "push", { days_won_total: "12" });
    expect(push.ok).toBe(true);
    if (push.ok) expect(push.value).toContain("Your 12 days are safe");
    const app = renderAtom(atom.value, "app", { days_won_total: "12" });
    expect(app.ok).toBe(true);
    if (app.ok) expect(app.value).toContain("you have won 12 smoke-free days");
    expect(renderAtom(atom.value, "app", {}).ok).toBe(false);
    expect(renderAtom(atom.value, "email", { days_won_total: "12" }).ok).toBe(false);
  });

  it("renders exercises as numbered steps", async () => {
    const catalog = await fixtureCatalog();
    const atom = resolveAtom(catalog, "smoking.lapse.debrief-flow");
    if (!atom.ok) throw new Error(atom.error);
    const rendered = renderAtom(atom.value, "app");
    expect(rendered.ok).toBe(true);
    if (rendered.ok) expect(rendered.value).toMatch(/^1\. What happened/);
  });

  it("draft atoms are unservable in production and servable in development", async () => {
    const catalog = await fixtureCatalog();
    const atom = resolveAtom(catalog, "smoking.lapse.opener");
    if (!atom.ok) throw new Error(atom.error);
    expect(assertServable(atom.value, "production").ok).toBe(false);
    expect(assertServable(atom.value, "development").ok).toBe(true);
  });

  it("contraindication flags block matching atoms", async () => {
    const catalog = await fixtureCatalog();
    const atom = resolveAtom(catalog, "smoking.lapse.opener");
    if (!atom.ok) throw new Error(atom.error);
    expect(isContraindicated(atom.value, ["ed-flagged"])).toBe(false);
    expect(isContraindicated({ ...atom.value, contraindications: ["ed-flagged"] }, ["ed-flagged"])).toBe(true);
  });
});
