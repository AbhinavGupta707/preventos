import { describe, expect, it } from "vitest";
import { normalize } from "../src/normalize.js";

describe("normalize — de-obfuscation views", () => {
  it("lowercases and collapses whitespace", () => {
    expect(normalize("I'm  Going To\nEnd it")).toBe("i'm going to end it");
  });

  it("joins spaced-out letters (3+ single chars); word boundaries inside a run are lost", () => {
    expect(normalize("k i l l  m y s e l f")).toBe("killmyself");
    expect(normalize("s u i c i d e is the only option left")).toBe("suicideis the only option left");
    expect(normalize("s t r a n g l e d me this morning")).toContain("strangled");
  });

  it("joins short-token obfuscation runs with at least two single chars", () => {
    expect(normalize("he c ho k ed me last week")).toContain("choked");
  });

  it("does not join ordinary short words", () => {
    expect(normalize("i am ok so it is fine")).toBe("i am ok so it is fine");
  });

  it("maps leetspeak inside lettered tokens only", () => {
    expect(normalize("su1cide is the only way out")).toBe("suicide is the only way out");
    expect(normalize("t0ok like 30 parasetamol")).toBe("took like 30 parasetamol");
    expect(normalize("m1xd my antidepressants w alc0h0l")).toContain("alcohol");
    expect(normalize("BP just read 210 over 120")).toBe("bp just read 210 over 120");
    expect(normalize("called 999 but he unplugged the phone")).toContain("999");
  });

  it("strips censor characters inside tokens", () => {
    expect(normalize("k*ll myself")).toBe("kll myself");
    expect(normalize("k*ept me locked in")).toBe("kept me locked in");
    expect(normalize("r@ped")).toBe("raped");
  });

  it("strips emoji and exotic punctuation to spaces", () => {
    expect(normalize("this is torture 😩 honestly")).toBe("this is torture honestly");
  });

  it("keeps apostrophes so contractions survive", () => {
    expect(normalize("he won't let me leave")).toBe("he won't let me leave");
  });

  it("is deterministic", () => {
    const input = "s u i c i d e 2nite k*ll m*self";
    expect(normalize(input)).toBe(normalize(input));
  });
});
