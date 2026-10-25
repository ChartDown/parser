// ChartDown conformance runner. MIT License.
//
//   node conformance/run.mjs                 checks the reference parser in playground/index.html
//   node conformance/run.mjs ./adapter.mjs   checks another implementation
//
// An adapter module exports:
//   toJSON(source)            -> the JSON form of the chart (spec Appendix A)
//   display(source, options)  -> optional, for the display cases of spec 12:
//                                { homeKey, keys, rows } as described in README.md
//   write(json)               -> optional, for the writer cases of spec Appendix C:
//                                the canonical text of a chart's JSON form
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const DIR = new URL("./", import.meta.url);

// Spec sections with parser rules: each needs at least one case.
const REQUIRED = ["2", "3", "4", "4.1", "5", "5.1", "5.2", "5.3", "6", "7", "7.1", "8", "9", "9.1",
  "10", "10.1", "11.1", "11.2", "11.3", "12", "13", "14", "15", "C", "C.1", "C.2", "C.3", "C.4", "C.5"];

function readCases() {
  const cases = [];
  for (const file of readdirSync(DIR).filter(f => /^(\d{2}|[A-Z])(\.\d+)?-.+\.md$/.test(f)).sort()) {
    const chunks = readFileSync(new URL(file, DIR), "utf8").split(/^### /m).slice(1);
    for (const chunk of chunks) {
      const heading = chunk.slice(0, chunk.indexOf("\n")).trim();
      const block = lang => new RegExp("```" + lang + "\\n([\\s\\S]*?)```").exec(chunk)?.[1];
      const source = block("chartdown"), expected = block("json"), display = block("display");
      const canonical = block("canonical");
      if (source === undefined || (expected === undefined) === (canonical === undefined)) {
        throw new Error(`${file}: "${heading}" needs a chartdown block and a json or canonical block`);
      }
      cases.push({ file, heading, section: heading.split(" ")[0], source, canonical,
        expected: expected && JSON.parse(expected), display: display && JSON.parse(display) });
    }
  }
  return cases;
}

// The reference parser: the playground's script, up to the part that needs a page.
function playground() {
  const html = readFileSync(new URL("../playground/index.html", DIR), "utf8");
  const code = html.slice(html.indexOf('"use strict";'), html.indexOf("const ed = document"));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(code + "\nthis.api = {parse, toJSON, toChartDown, showRoot, showQuality, rowCtx, state};", ctx);
  const pg = ctx.api;
  return {
    toJSON: source => pg.toJSON(pg.parse(source)),
    write: json => pg.toChartDown(json),
    display(source, { style, key }) {
      const doc = pg.parse(source);
      pg.state.mode = style;
      const disp = key ? key.replace(/m$/, "") : doc.keyRoot;
      const special = { nc: "x", rep: "%", tie: "=" };
      const rows = doc.sections.flatMap(s => s.rows);
      return {
        homeKey: disp + (doc.minor ? "m" : ""),
        keys: rows.map(r => {
          const c = pg.rowCtx(r, doc.keyRoot, disp);
          return c.disp + (c.minor ? "m" : "");
        }),
        rows: rows.map(r => {
          const c = pg.rowCtx(r, doc.keyRoot, disp);
          const root = x => pg.showRoot(x, style, c.src, c.disp, c.minor);
          return r.bars.map(b => b.items.map(it => {
            if (special[it.t]) return special[it.t];
            if (it.t === "riff") return "R[ " + it.notes.map(n => n.rest ? "x" : root(n.root)).join(" ") + " ]";
            return root(it.root) + pg.showQuality(it.q, style) + (it.bass ? "/" + root(it.bass) : "");
          }).join(" ")).join(" | ");
        }),
      };
    },
  };
}

// Every field the case shows must match; fields it does not show are ignored
// (Appendix A lets producers add fields). Arrays match element by element.
// Numbers match within 1e-9. Warnings match by line number only, in any order.
function mismatch(actual, expected, path) {
  if (typeof expected === "number" && typeof actual === "number") {
    return Math.abs(actual - expected) < 1e-9 ? null : `${path}: got ${actual}, expected ${expected}`;
  }
  if (expected === null || typeof expected !== "object") {
    return actual === expected ? null : `${path}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`;
  }
  if (actual === null || typeof actual !== "object" || Array.isArray(actual) !== Array.isArray(expected)) {
    return `${path}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`;
  }
  if (Array.isArray(expected) && actual.length !== expected.length) {
    return `${path}: got ${actual.length} elements, expected ${expected.length}`;
  }
  for (const key of Object.keys(expected)) {
    if (path === "" && key === "warnings") {
      const lines = list => list.map(w => w.line).sort((a, b) => a - b).join(", ");
      const got = lines(actual.warnings ?? []), want = lines(expected.warnings);
      if (got !== want) return `warnings: got lines [${got}], expected [${want}]`;
      continue;
    }
    const problem = mismatch(actual[key], expected[key], path + (Array.isArray(expected) ? `[${key}]` : `.${key}`));
    if (problem) return problem;
  }
  return null;
}

// Spec Appendix C: the canonical text reads back as the same chart (all but its version), and writing
// it again gives the same text. Applies to charts with no warnings.
function roundTrip(impl, source) {
  const strip = j => ({ ...j, chartdown: null, meta: { ...j.meta, chartdown: null }, warnings: [] });
  const json = impl.toJSON(source), text = impl.write(json), again = impl.toJSON(text);
  const problem = mismatch(strip(again), strip(json), "");
  if (problem) return `read back differently: ${problem}\n     text:\n${text}`;
  if (impl.write(again) !== text) return `writing it again changed it:\n${impl.write(again)}`;
  if ((again.warnings ?? []).length) return `its text has warnings: ${JSON.stringify(again.warnings)}\n${text}`;
  return null;
}
const showText = t => JSON.stringify(t).slice(1, -1).replace(/\\n/g, "\n       ");

const impl = process.argv[2]
  ? await import(pathToFileURL(process.argv[2]).href)
  : playground();
const cases = readCases();
let failed = 0, skipped = 0, trips = 0;
for (const c of cases) {
  if ((c.display && !impl.display) || (c.canonical !== undefined && !impl.write)) { skipped++; continue; }
  let problem;
  try {
    if (c.canonical !== undefined) {
      const json = impl.toJSON(c.source), text = impl.write(json);
      problem = text === c.canonical
        ? ((json.warnings ?? []).length ? null : roundTrip(impl, c.source))
        : `wrote:\n       ${showText(text)}\n     expected:\n       ${showText(c.canonical)}`;
    } else if (c.display) {
      problem = mismatch(impl.display(c.source, c.display), c.expected, "");
    } else {
      problem = mismatch(impl.toJSON(c.source), c.expected, "");
      // Every parser case with no warnings must also survive a round trip through a writer.
      if (!problem && impl.write && !(c.expected.warnings ?? []).length) { trips++; problem = roundTrip(impl, c.source); }
    }
  } catch (e) {
    problem = `threw ${e && e.stack || e}`;
  }
  if (problem) { failed++; console.log(`FAIL ${c.file}: ${c.heading}\n     ${problem}`); }
}
const covered = new Set(cases.map(c => c.section));
const missing = REQUIRED.filter(s => !covered.has(s));
const unknown = [...covered].filter(s => !REQUIRED.includes(s));
if (missing.length) console.log(`Spec sections with no case: ${missing.join(", ")}`);
if (unknown.length) console.log(`Cases for sections without parser rules: ${unknown.join(", ")}`);
console.log(`${cases.length - failed - skipped} passed, ${failed} failed` + (skipped ? `, ${skipped} display or writer cases skipped` : "") +
  (trips ? ` (${trips} parser cases also checked through the writer)` : ""));
process.exit(failed || missing.length || unknown.length ? 1 : 0);
