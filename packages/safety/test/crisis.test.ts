import { describe, expect, it } from "vitest";
import { RISK_CLASSES, VERTICALS } from "@preventos/domain";
import { classify } from "../src/classify.js";
import { routeCrisis } from "../src/crisis.js";

describe("routeCrisis — total, deterministic, vertical-aware", () => {
  it("resolves every (riskClass × tier × vertical) combination", () => {
    for (const riskClass of RISK_CLASSES) {
      for (const tier of [1, 2] as const) {
        for (const vertical of VERTICALS) {
          const flow = routeCrisis({ riskClass, tier, vertical });
          expect(flow.flowId).toBe(`crisis.${riskClass}.t${tier}.${vertical}`);
          expect(flow.steps.length).toBeGreaterThan(0);
          expect(flow.resources.length).toBeGreaterThan(0);
          expect(flow.nightSafe).toBe(true);
          expect(flow.emergencyNumber).toBe("999");
        }
      }
    }
  });

  it("is deterministic", () => {
    const a = routeCrisis({ riskClass: "self_harm", tier: 1, vertical: "smoking" });
    const b = routeCrisis({ riskClass: "self_harm", tier: 1, vertical: "smoking" });
    expect(b).toEqual(a);
  });

  it("tier-1 self-harm flow leads with 999 and Samaritans", () => {
    const flow = routeCrisis({ riskClass: "self_harm", tier: 1, vertical: "vaping" });
    const names = flow.resources.map((r) => r.name);
    expect(names).toContain("Samaritans");
    expect(flow.resources.some((r) => r.phone === "999")).toBe(true);
  });

  it("alcohol vertical adds the do-not-stop-suddenly warning on withdrawal risk (E17)", () => {
    const flow = routeCrisis({ riskClass: "withdrawal_risk", tier: 1, vertical: "alcohol" });
    const text = flow.steps.map((s) => s.script).join(" ");
    expect(text.toLowerCase()).toContain("do not suddenly stop");
    expect(flow.resources.some((r) => r.name === "Drinkline")).toBe(true);
  });

  it("abuse flows carry the domestic abuse helpline; safeguarding carries NSPCC and Childline", () => {
    const dv = routeCrisis({ riskClass: "abuse_dv", tier: 1, vertical: "alcohol" });
    expect(dv.resources.some((r) => r.name.includes("Domestic Abuse"))).toBe(true);
    const sg = routeCrisis({ riskClass: "safeguarding", tier: 1, vertical: "smoking" });
    expect(sg.resources.some((r) => r.name === "NSPCC")).toBe(true);
    expect(sg.resources.some((r) => r.name === "Childline")).toBe(true);
  });

  it("tier-2 flows are supportive, not alarmist: no 999-first framing", () => {
    const flow = routeCrisis({ riskClass: "self_harm", tier: 2, vertical: "sleep" });
    expect(flow.steps[0]?.script).not.toMatch(/999/);
  });

  it("composes with classify(): a tier-1 message routes end-to-end", () => {
    const assessment = classify("I'm going to kill myself tonight");
    expect(assessment.tier).toBe(1);
    expect(assessment.riskClass).toBe("self_harm");
    const flow = routeCrisis({ riskClass: assessment.riskClass!, tier: 1, vertical: "sleep" });
    expect(flow.flowId).toBe("crisis.self_harm.t1.sleep");
  });

  it("scripted copy never contains template holes or LLM placeholders", () => {
    for (const riskClass of RISK_CLASSES) {
      for (const tier of [1, 2] as const) {
        for (const vertical of VERTICALS) {
          const flow = routeCrisis({ riskClass, tier, vertical });
          for (const step of flow.steps) {
            expect(step.script).not.toMatch(/\{\{|\}\}|\$\{|TODO|LLM/);
          }
        }
      }
    }
  });
});
