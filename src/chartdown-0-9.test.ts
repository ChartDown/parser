import { describe, expect, it } from "vitest";
import { eighthsPerMinute, meterBeat, parse, rowBeatUnit, toJSON } from "./index.js";

const rows = (source: string) => parse(source).sections.flatMap((section) => section.rows);

describe("R-00.18 a tempo's beat unit (ChartDown 0.9, spec 11.3)", () => {
  it("R-00.18 tempo: 58 q. names its unit, and is 174 eighth notes a minute", () => {
    const chart = parse("---\nmeter: 6/8\ntempo: 58 q.\n---\n## A\n1 | 4");
    expect(chart.warnings).toEqual([]);
    expect([chart.tempo, chart.tempoUnit]).toEqual([58, "q."]);
    const [row] = chart.sections[0]!.rows;
    expect([row?.tempo, row?.tempoUnit]).toEqual([58, "q."]);
    expect(eighthsPerMinute(58, "q.")).toBe(174);
  });

  it("R-00.18 without a unit, 6/8, 9/8 and 12/8 count the dotted quarter; the others their bottom number", () => {
    const unit = (meter: string) => {
      const [beats, of] = meter.split("/").map(Number) as [number, number];
      return meterBeat({ beats, unit: of });
    };
    expect(["6/8", "9/8", "12/8"].map(unit)).toEqual(["q.", "q.", "q."]);
    expect(["2/2", "3/4", "4/4", "6/4", "3/8", "7/8", "6/16"].map(unit)).toEqual([
      "h",
      "q",
      "q",
      "q",
      "e",
      "e",
      "s",
    ]);
  });

  it("R-00.18 an unwritten unit follows @meter, a written one stays, and @tempo takes one too", () => {
    const [first, second, third] = rows(
      "---\ntempo: 72\n---\n## A\n1\n@meter 6/8\n1\n@tempo 87q\n1\n@meter 4/4\n1",
    );
    expect(first && rowBeatUnit(first)).toBe("q");
    expect(second && rowBeatUnit(second)).toBe("q.");
    expect(third && [third.tempo, rowBeatUnit(third)]).toEqual([87, "q"]);
  });

  it("R-00.18 ? keeps the number and no unit; the JSON form has neither unit nor eighths", () => {
    const chart = parse("---\nmeter: 6/8\ntempo: 58 ?\n---\n## A\n1");
    expect(chart.warnings).toEqual([]);
    expect(chart.tempoUnconfirmed).toBe(true);
    const row = toJSON(chart).sections[0]!.rows[0];
    expect([row?.tempo, row?.tempoUnit, row?.tempoEpm]).toEqual([58, null, null]);
  });

  it("R-00.18 a unit it can't read is a warning, and the meter's beat counts", () => {
    const chart = parse("---\ntempo: 72 w\n---\n## A\n1\n@tempo 90 bpm\n1");
    expect(chart.warnings.map((warning) => [warning.line, warning.code])).toEqual([
      [2, "bad-tempo"],
      [6, "bad-tempo-directive"],
    ]);
    const json = toJSON(chart).sections[0]!.rows;
    expect(json.map((row) => [row.tempo, row.tempoUnit, row.tempoEpm])).toEqual([
      [72, "q", 144],
      [90, "q", 180],
    ]);
  });

  it("R-00.18 a tempo with decimals, and a reused section keeps its unit", () => {
    const chart = parse("---\ntempo: 74.5 q.\nmeter: 6/8\n---\n## A\n1\n## B\n@use A");
    expect(toJSON(chart).sections.map((section) => section.rows[0]?.tempoEpm)).toEqual([
      223.5, 223.5,
    ]);
  });
});
