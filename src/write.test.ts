import { describe, expect, it } from "vitest";
import {
  parse as parsePlayground,
  toChartDown,
  toJSON as playgroundJson,
} from "../fixtures/playground-parser.js";
import { toJSON } from "./json.js";
import { parse } from "./parse.js";
import {
  EXAMPLES,
  EXAMPLES_09,
  EXAMPLES_10,
  fixture,
  fixture09,
  fixture10,
} from "./test-helpers.js";
import { write, WRITTEN_VERSION } from "./write.js";

const json = (source: string) => toJSON(parse(source));
const canonical = (source: string) => write(json(source));
/** The JSON form without what the canonical text doesn't keep: the version (spec C.1). */
const meaning = (source: string) => {
  const { chartdown: _version, meta, warnings: _warnings, ...rest } = json(source);
  const { chartdown: _declared, ...fields } = meta;
  return { ...rest, meta: fields };
};

const CHARTS = [
  ...EXAMPLES_10.map((name) => [`0.10/${name}`, fixture10(name)] as const),
  ...EXAMPLES_09.map((name) => [`0.9/${name}`, fixture09(name)] as const),
  ...EXAMPLES.map((name) => [name, fixture(name)] as const),
];

describe("R-00.19 the canonical text of a chart (ChartDown 0.10, spec Appendix C)", () => {
  it.each(CHARTS)(
    "R-00.19 %s reads back as the same chart, and writing it again is stable",
    (_, source) => {
      expect(parse(source).warnings).toEqual([]);
      const text = canonical(source);
      expect(parse(text).warnings).toEqual([]);
      expect(meaning(text)).toEqual(meaning(source));
      expect(canonical(text)).toBe(text);
    },
  );

  it.each(EXAMPLES_10)(
    "R-00.19 the 0.10 example %s is written as the playground writes it",
    (name) => {
      const source = fixture10(name);
      expect(canonical(source)).toBe(toChartDown(playgroundJson(parsePlayground(source))));
    },
  );

  it("R-00.19 the header comes first with the version the writer writes, then the fields of spec 3 in order", () => {
    const text = canonical(
      "---\nfeel: Ballad\nchartdown: 0.6\ncapo: 2\ntitle: Open Road\nkey: G\n---\n## A\n1\n",
    );
    expect(WRITTEN_VERSION).toBe("0.10");
    expect(text).toBe(
      "---\nchartdown: 0.10\ntitle: Open Road\nkey: G\nfeel: Ballad\ncapo: 2\n---\n\n## A\n1\n",
    );
  });

  it("R-00.19 notes are written with their passes and roles, and a reused section as @use", () => {
    const text = canonical(
      "## Verse\n> Soft\n>MD: Watch me\n> MD 1x,3x keys, bass: Out\n1 | 4\n\n## Again\n@use Verse x3\n",
    );
    expect(text).toBe(
      "---\nchartdown: 0.10\n---\n\n## Verse\n> Soft\n> MD: Watch me\n> MD 1x,3x keys, bass: Out\n1 | 4\n\n## Again\n@use Verse 3x\n",
    );
  });

  it("R-00.19 key, meter and tempo are written only where they change, the unit only when it isn't the meter's beat", () => {
    const text = canonical(
      "---\nkey: G\ntempo: 72\n---\n## A\n1\n@key G\n4\n@meter 6/8\n@tempo 58\n1\n@tempo 87 q\n5\n@tempo 58 ?\n1\n",
    );
    expect(text).toBe(
      "---\nchartdown: 0.10\nkey: G\ntempo: 72\n---\n\n## A\n1\n4\n@meter 6/8\n@tempo 58\n1\n@tempo 87 q\n5\n@tempo 58 ?\n1\n",
    );
  });

  it("R-00.19 a reused section's key change goes at the end of the section before", () => {
    const text = canonical("---\nkey: G\n---\n## Verse\n1\n\n@key A\n## Up\n@use Verse\n");
    expect(text).toBe(
      "---\nchartdown: 0.10\nkey: G\n---\n\n## Verse\n1\n@key A\n\n## Up\n@use Verse\n",
    );
  });

  it("R-00.19 a bar's parts follow the order of spec C.4, with one spelling for reserved words", () => {
    expect(
      canonical('## A\n|: "Take the open road" {drums: in} 1 4 {mf} {segno} | 5 :| x3\n'),
    ).toContain('|: {segno} {mf} 1 4 {drums: in} "Take the open road" | 5 :| 3x\n');
    // The JSON form keeps the end marks in the order written, so the writer does too: the
    // reference writer's behavior, which the round trip needs (spec C.4 lists a fixed order).
    expect(
      canonical("## A\n{segno} 1 | 5 {to coda} {D.S. al Coda}\n## Coda\n{coda} 1\n"),
    ).toContain("{segno} 1 | 5 {to coda} {D.S. al coda}\n");
  });

  it.each([
    ["1:3 4:1", "1 4:1"],
    ["1! x:3", "1! x:3"],
    ["1:2 4 5 6", "1:2 4 5 6"],
    ["1:2 4:2", "1 4"],
    ["1 4 5", "1 4 5"],
    ["1-7:2 ''4maj7:2!~", "1m7 ''4maj7!~"],
  ])("R-00.19 the beats of %s are written as %s", (bar, written) => {
    const text = canonical(`## A\n${bar}\n`);
    expect(text.split("\n").at(-2)).toBe(written);
  });

  it("R-00.19 numbers have no trailing zeros and at most 3 decimal places", () => {
    expect(canonical("---\ntempo: 74.50\n---\n## A\n@tempo 80.0\n[p:1.5] 5\n")).toBe(
      "---\nchartdown: 0.10\ntempo: 74.50\n---\n\n## A\n@tempo 80\n[p:1.5] 5\n",
    );
  });
});
