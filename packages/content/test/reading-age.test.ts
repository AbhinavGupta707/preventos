import { describe, expect, it } from "vitest";
import { countSyllables, estimateReadingAge } from "../src/reading-age.js";

describe("countSyllables", () => {
  it("counts common words", () => {
    expect(countSyllables("cat")).toBe(1);
    expect(countSyllables("water")).toBe(2);
    expect(countSyllables("banana")).toBe(3);
    expect(countSyllables("cigarette")).toBe(3);
  });

  it("handles silent e and -le endings", () => {
    expect(countSyllables("smoke")).toBe(1);
    expect(countSyllables("little")).toBe(2);
  });

  it("never returns zero for a word", () => {
    expect(countSyllables("the")).toBeGreaterThanOrEqual(1);
  });
});

describe("estimateReadingAge", () => {
  it("returns undefined for empty or wordless text", () => {
    expect(estimateReadingAge("")).toBeUndefined();
    expect(estimateReadingAge("... !!!")).toBeUndefined();
  });

  it("scores short plain copy as readable by young readers", () => {
    const simple = "The cat sat on the mat. It was a big cat. The cat likes fish.";
    const age = estimateReadingAge(simple);
    expect(age).toBeDefined();
    expect(age!).toBeLessThanOrEqual(8);
  });

  it("scores dense bureaucratic prose as adult-level", () => {
    const dense =
      "Notwithstanding the aforementioned considerations, implementation of comprehensive behavioural " +
      "modification methodologies necessitates substantial organisational infrastructure investment.";
    const age = estimateReadingAge(dense);
    expect(age).toBeDefined();
    expect(age!).toBeGreaterThanOrEqual(14);
  });

  it("orders simple below complex", () => {
    const simple = estimateReadingAge("You can do this. One day at a time. We will help.");
    const complex = estimateReadingAge(
      "Sustained abstinence probability increases proportionally with personalised intervention intensity.",
    );
    expect(simple!).toBeLessThan(complex!);
  });
});
