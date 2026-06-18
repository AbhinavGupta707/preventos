import { describe, expect, it } from "vitest";

import { programmeAccess, programmeSelectable, publicProgrammes } from "../lib/programme-access";

describe("web internal programme gates", () => {
  it("keeps QuitKit and Exhale open while Steady and Nightshift default gated", () => {
    expect(programmeAccess("quitkit", {})).toBe("open");
    expect(programmeAccess("exhale", {})).toBe("open");
    expect(programmeAccess("steady", {})).toBe("gated");
    expect(programmeAccess("nightshift", {})).toBe("gated");
  });

  it("requires explicit internal flags for Steady and Nightshift", () => {
    expect(programmeSelectable("steady", { NEXT_PUBLIC_PREVENTOS_ENABLE_STEADY_INTERNAL: "true" })).toBe(true);
    expect(programmeSelectable("nightshift", { NEXT_PUBLIC_PREVENTOS_ENABLE_NIGHTSHIFT_INTERNAL: "1" })).toBe(true);
  });

  it("filters stale local programme state before public rendering or submit", () => {
    expect(publicProgrammes(["quitkit", "steady", "nightshift"], {})).toEqual(["quitkit"]);
  });
});
