import { describe, expect, it } from "vitest";
import { parse, playOrder, toJSON } from "./index.js";

const order = (source: string) => {
  const chart = parse(source);
  return playOrder(chart).map((step) => {
    const section = chart.sections[step.section]?.name ?? "";
    return `${section}.${step.bar}/${step.pass}`;
  });
};

describe("R-00.17 a section reused with a count (ChartDown 0.8, spec 5.2)", () => {
  it("R-00.17 @use Name 3x and @use Name x3 play the copied rows three times in a row", () => {
    for (const count of ["3x", "x3", "3X"]) {
      const chart = parse(
        `## Bridge 2\n6m | 4\n## Bridge 3\n@use Bridge 2 ${count}\n## Outro\n1\n`,
      );
      expect(chart.warnings).toEqual([]);
      expect(chart.sections[1]?.use).toEqual({ name: "Bridge 2", line: 4, times: 3 });
    }
    expect(order("## Bridge 2\n6m | 4\n## Bridge 3\n@use Bridge 2 3x\n## Outro\n1\n")).toEqual([
      "Bridge 2.1/1",
      "Bridge 2.2/1",
      ...["Bridge 3.1/1", "Bridge 3.2/1"].flatMap((step) => [step]),
      "Bridge 3.1/1",
      "Bridge 3.2/1",
      "Bridge 3.1/1",
      "Bridge 3.2/1",
      "Outro.1/1",
    ]);
  });

  it("R-00.17 each time through plays its own repeats again: a copied 2x played 2x is four times", () => {
    const steps = order("## Bridge 2\n|: 6m | 4 :| 2x\n1 | 5\n## Bridge 3\n@use Bridge 2 2x\n");
    const copy = steps.filter((step) => step.startsWith("Bridge 3"));
    expect(copy.filter((step) => step === "Bridge 3.1/1")).toHaveLength(2);
    expect(copy.filter((step) => step === "Bridge 3.1/2")).toHaveLength(2);
    expect(copy.filter((step) => step === "Bridge 3.3/1")).toHaveLength(2);
    expect(copy).toHaveLength(12);
  });

  it("R-00.17 0x is read as 1x, with a warning on its line", () => {
    const chart = parse("## A\n1 | 4\n## B\n@use A 0x\n");
    expect(chart.warnings.map((warning) => [warning.line, warning.code])).toEqual([
      [4, "use-zero-times"],
    ]);
    expect(chart.sections[1]?.use?.times).toBe(1);
    expect(order("## A\n1 | 4\n## B\n@use A 0x\n")).toEqual(["A.1/1", "A.2/1", "B.1/1", "B.2/1"]);
  });

  it("R-00.17 a note for the second pass of a counted copy needs no repeat of its own", () => {
    const chart = parse("## A\n1 | 4\n## B\n> MD 2x: Build here.\n@use A 2x\n");
    expect(chart.warnings).toEqual([]);
    expect(
      parse("## A\n1 | 4\n## B\n> MD 2x: Build here.\n@use A\n").warnings.map((w) => w.code),
    ).toEqual(["note-pass-without-repeat"]);
  });

  it("R-00.17 the JSON form gives each section's count, or null", () => {
    const json = toJSON(parse("## A\n1\n## B\n@use A 2x\n## C\n@use A\n## D\n@use A 0x\n"));
    expect(json.sections.map((section) => section.times)).toEqual([null, 2, null, 1]);
  });

  it("R-00.4 chartdown: 0.8 is a known version", () => {
    expect(parse("---\nchartdown: 0.8\n---\n## A\n1\n").warnings).toEqual([]);
  });
});
