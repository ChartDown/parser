import { parseNote, readHeader } from "./header.js";
import { analyze } from "./navigation.js";
import { parseRow } from "./row.js";
import type { Chart, Key, Meter, ParseOptions, Row, Section, Warning } from "./types.js";
import { readTempo, type TempoText } from "./tempo.js";
import { createWarning, type Warn } from "./warnings.js";

/** The ChartDown version this parser reads and writes (R-00.4). */
export const SUPPORTED_VERSION = "0.9";

/**
 * The versions a chart may declare without a warning (R-00.4). Charts written for 0.4 and 0.5
 * parse the same in 0.6; a mark that was free text in them now has its meaning (spec 17).
 */
export const READABLE_VERSIONS: readonly string[] = [
  "0.3",
  "0.4",
  "0.5",
  "0.6",
  "0.7",
  "0.8",
  "0.9",
];

function parseKey(text: string | undefined): Key {
  const match = /^([A-G][b#]?)(m?)/.exec(text ?? "C");
  return match
    ? { root: match[1] as string, minor: match[2] === "m" }
    : { root: "C", minor: false };
}

/** The line of a header field, for a warning about its value. */
function headerLine(lines: readonly string[], bodyStart: number, name: string): number {
  const at = lines
    .slice(0, bodyStart)
    .findIndex((line) => new RegExp(`^\\s*${name}\\s*:`, "i").test(line));
  return at >= 0 ? at + 1 : 1;
}

function parseMeter(text: string | undefined): Meter {
  const match = /^(\d+)\s*\/\s*(\d+)$/.exec(text ?? "4/4");
  return match ? { beats: Number(match[1]), unit: Number(match[2]) } : { beats: 4, unit: 4 };
}

/**
 * Parses ChartDown 0.6 text into a chart. Never throws: anything it cannot read is
 * skipped and reported in `warnings` with its line number (spec 13). Instruments come
 * from `options.instruments`, or the spec's standard roles when it is not given (R-00.1).
 */
export function parse(source: string, options: ParseOptions = {}): Chart {
  const warnings: Warning[] = [];
  const warn: Warn = (line, code, values) => warnings.push(createWarning(line, code, values));
  const lines = source.replace(/\r/g, "").split("\n");

  const {
    fields: header,
    version,
    instruments,
    numbering,
    roles,
    bodyStart,
  } = readHeader(lines, READABLE_VERSIONS, options, warn);
  let index = bodyStart;
  const key = parseKey(header.key);
  const startMeter = parseMeter(header.meter);
  // Spec 11.3 (0.9): a tempo may name its beat unit, or `?`; a unit it can't read is a warning.
  const headTempo = header.tempo === undefined ? undefined : readTempo(header.tempo);
  if (header.tempo !== undefined && (!headTempo || headTempo.badUnit))
    warn(headerLine(lines, bodyStart, "tempo"), "bad-tempo");
  const startTempo = headTempo?.bpm || Number.parseFloat(header.tempo ?? "") || undefined;

  const sections: Section[] = [];
  const startKeys = new Map<Section, Key>();
  let section: Section | undefined;
  let currentKey = key;
  let currentMeter = startMeter;
  let currentTempo = startTempo;
  let currentUnit: TempoText = headTempo ?? { bpm: 0 };
  let pendingKeyChange: Key | undefined;
  let pendingMeter: Meter | undefined;
  let pendingTempo: number | undefined;

  for (; index < lines.length; index++) {
    const text = (lines[index] as string).trim();
    const line = index + 1;
    if (!text || text.startsWith("//")) continue;

    if (text.startsWith("##")) {
      section = { name: text.replace(/^#+\s*/, "") || "Section", line, notes: [], rows: [] };
      sections.push(section);
      startKeys.set(section, currentKey);
      continue;
    }
    if (!section) {
      warn(line, "no-section");
      continue;
    }
    if (text.startsWith(">")) {
      section.notes.push(parseNote(text.replace(/^>\s?/, ""), line, roles, warn));
      continue;
    }
    const use = /^@use\s+(.+)$/i.exec(text);
    if (use) {
      // Spec 5.2 (0.8): a count at the end, `3x` or `x3`, plays the copied rows that many times.
      const counted = /^(.*?)\s+(?:(\d+)x|x(\d+))$/i.exec((use[1] as string).trim());
      const name = counted ? (counted[1] as string) : (use[1] as string).trim();
      const times = counted ? Number(counted[2] ?? counted[3]) : undefined;
      section.use = { name, line };
      if (times === 0) {
        warn(line, "use-zero-times");
        section.use.times = 1;
      } else if (times !== undefined) section.use.times = times;
      continue;
    }
    // Directive names are read in any case (spec 15); a key it cannot read is a warning.
    if (/^@key\b/i.test(text)) {
      // Only the name ignores case: the key keeps its spelling (`@key Bm`, never `@key bm`).
      const keyChange = /^([A-G][b#]?)(m?)\s*$/.exec(text.replace(/^@key\s+/i, ""));
      if (keyChange) {
        currentKey = { root: keyChange[1] as string, minor: keyChange[2] === "m" };
        pendingKeyChange = currentKey;
      } else warn(line, "bad-key-directive");
      continue;
    }
    if (/^@meter\b/i.test(text)) {
      const change = /^@meter\s+(\d+)\s*\/\s*(\d+)\s*$/i.exec(text);
      if (change) {
        currentMeter = { beats: Number(change[1]), unit: Number(change[2]) };
        pendingMeter = currentMeter;
      } else warn(line, "bad-meter-directive");
      continue;
    }
    if (/^@tempo\b/i.test(text)) {
      const change = readTempo(text.replace(/^@tempo\s*/i, ""));
      if (change) {
        currentTempo = change.bpm;
        currentUnit = change;
        pendingTempo = currentTempo;
        if (change.badUnit) warn(line, "bad-tempo-directive");
      } else warn(line, "bad-tempo-directive");
      continue;
    }
    if (text.startsWith("@")) {
      warn(line, "unknown-directive", { directive: text.split(/\s/)[0] as string });
      continue;
    }

    const bars = parseRow(text, { line, beatsPerBar: currentMeter.beats, roles, warn });
    if (!bars) continue;
    // Spec 5.3: a pickup is the first bar of a section; anywhere else it is a warning.
    const target = section;
    bars.forEach((bar, position) => {
      if (bar.pickup !== undefined && (target.rows.length > 0 || position > 0)) {
        warn(line, "pickup-not-first");
        delete bar.pickup;
      }
    });
    const row: Row = { line, key: { ...currentKey }, meter: { ...currentMeter }, bars };
    if (currentTempo !== undefined) row.tempo = currentTempo;
    if (currentTempo !== undefined && currentUnit.unit) row.tempoUnit = currentUnit.unit;
    if (currentTempo !== undefined && currentUnit.unconfirmed) row.tempoUnconfirmed = true;
    if (pendingKeyChange) {
      row.keyChange = { ...pendingKeyChange };
      pendingKeyChange = undefined;
    }
    if (pendingMeter) {
      row.meterChange = { ...pendingMeter };
      pendingMeter = undefined;
    }
    if (pendingTempo !== undefined) {
      row.tempoChange = pendingTempo;
      pendingTempo = undefined;
    }
    section.rows.push(row);
  }

  // `@use` copies the rows of the first earlier section with that name, in the key
  // in effect where the reusing section starts (spec 5.2). It must be the section's
  // only content line: a section with its own rows keeps them.
  sections.forEach((target, position) => {
    if (target.use === undefined) return;
    if (target.rows.length > 0) {
      warn(target.use.line, "use-with-rows");
      return;
    }
    const name = target.use.name.toLowerCase();
    const original = sections
      .slice(0, position)
      .find((earlier) => earlier.name.toLowerCase() === name && earlier.rows.length > 0);
    if (!original) {
      warn(target.use.line, "use-not-found", { name: target.use.name });
      return;
    }
    const startKey = startKeys.get(target) ?? key;
    // The copy keeps the original's meter and tempo (and their change marks); only the key is
    // the current one (spec 5.2).
    target.rows = original.rows.map((row) => {
      const copy: Row = {
        line: row.line,
        key: { ...startKey },
        meter: { ...row.meter },
        bars: JSON.parse(JSON.stringify(row.bars)),
      };
      if (row.tempo !== undefined) copy.tempo = row.tempo;
      if (row.tempoUnit) copy.tempoUnit = row.tempoUnit;
      if (row.tempoUnconfirmed) copy.tempoUnconfirmed = true;
      if (row.meterChange) copy.meterChange = { ...row.meterChange };
      if (row.tempoChange !== undefined) copy.tempoChange = row.tempoChange;
      return copy;
    });
  });

  analyze(sections, warn);
  warnings.sort((a, b) => a.line - b.line);
  const chart: Chart = {
    header,
    key,
    meter: startMeter,
    instruments,
    numbering,
    sections,
    warnings,
  };
  if (startTempo !== undefined) chart.tempo = startTempo;
  if (startTempo !== undefined && headTempo?.unit) chart.tempoUnit = headTempo.unit;
  if (startTempo !== undefined && headTempo?.unconfirmed) chart.tempoUnconfirmed = true;
  if (version !== undefined) chart.version = version;
  return chart;
}
