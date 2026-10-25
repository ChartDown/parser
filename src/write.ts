// The canonical text of a chart (ChartDown 0.10, spec Appendix C; R-00.19).
import type { BarJson, ChartJson, ItemJson, RiffNoteJson } from "./json.js";
import { meterBeat, readTempo } from "./tempo.js";
import type { BeatUnit } from "./types.js";

/** The version the writer declares (spec C.1). */
export const WRITTEN_VERSION = "0.10";

/** The header fields of spec 3, in the order of its table (spec C.1). */
const HEADER_ORDER = [
  "instruments",
  "title",
  "artists",
  "key",
  "tempo",
  "meter",
  "feel",
  "numbering",
];

/** Navigation marks that act at the start of a bar (spec C.4); the rest act at its end. */
const NAV_START = new Set(["segno", "coda"]);

const NAV_TEXT: Record<string, string> = {
  segno: "segno",
  coda: "coda",
  tocoda: "to coda",
  fine: "fine",
  ds: "D.S.",
  dsalcoda: "D.S. al coda",
  dsalfine: "D.S. al fine",
  dc: "D.C.",
  dcalcoda: "D.C. al coda",
  dcalfine: "D.C. al fine",
};

/** Spec C.3: a decimal with no trailing zeros and at most 3 places. */
const num = (value: number): string => String(Math.round(value * 1000) / 1000);

/** The beat a meter's tempo counts when none is written, from its `N/D` text (spec 11.3). */
function beatOf(meter: string): BeatUnit | undefined {
  const match = /^(\d+)\/(\d+)$/.exec(meter);
  return match ? meterBeat({ beats: Number(match[1]), unit: Number(match[2]) }) : undefined;
}

/**
 * Which items get their `:beats` written (spec C.5): all of them when the shares don't add up to
 * the total; otherwise all but the biggest group of equal shares, on a tie the group whose share
 * needs more than 3 decimal places, then the earliest item's group.
 */
function beatsShown(list: readonly { beats: number }[], total: number): boolean[] {
  const sum = list.reduce((all, item) => all + item.beats, 0);
  if (Math.abs(sum - total) > 0.001) return list.map(() => true);
  const groups: { share: number; count: number }[] = [];
  for (const item of list) {
    const group = groups.find((g) => Math.abs(g.share - item.beats) < 1e-9);
    if (group) group.count++;
    else groups.push({ share: item.beats, count: 1 });
  }
  const odd = (share: number) => Math.abs(Math.round(share * 1000) / 1000 - share) > 1e-9;
  const left = groups.reduce((best, g) =>
    g.count > best.count || (g.count === best.count && odd(g.share) && !odd(best.share)) ? g : best,
  );
  return list.map((item) => Math.abs(item.beats - left.share) >= 1e-9);
}

/** `2x,3x drums, bass`: the passes and the roles of a note or a cue, `everyone` left out (spec C.2). */
function who(passes: readonly number[], roles: readonly string[]): string {
  return [
    passes.map((pass) => `${pass}x`).join(","),
    roles.filter((role) => role !== "everyone").join(", "),
  ]
    .filter(Boolean)
    .join(" ");
}

const isTimed = (item: ItemJson): item is Extract<ItemJson, { beats: number }> =>
  item.type === "chord" || item.type === "rest" || item.type === "riff";

/** One token of a bar, with its `:beats` when `shown` (spec C.5). */
function token(item: ItemJson, shown: boolean): string {
  if (item.type === "repeat") return "%";
  if (item.type === "tie") return "=";
  const beats = shown ? `:${num(item.beats)}` : "";
  if (item.type === "rest") return `x${beats}`;
  if (item.type === "riff") {
    const written = beatsShown(item.notes, item.beats);
    const note = (n: RiffNoteJson, index: number) =>
      (n.rest ? "x" : n.root) + (written[index] ? `:${num(n.beats)}` : "");
    return `R[ ${item.notes.map(note).join(" ")} ]${beats}`;
  }
  const chord = item.root + item.quality + (item.bass ? `/${item.bass}` : "");
  return (
    ["", "'", "''"][item.push] +
    (item.hold ? `<${chord}>` : chord) +
    beats +
    (item.stab ? "!" : "") +
    (item.fermata ? "~" : "")
  );
}

/** A bar's parts, in the order of spec C.4. */
function bar(b: BarJson): string {
  const parts: string[] = [];
  if (b.pickup) parts.push(`[p:${num(b.beats)}]`);
  if (b.meter) parts.push(`[m:${b.meter}]`);
  if (b.ending) parts.push(`[${b.ending.join(",")}]`);
  for (const mark of b.nav) if (NAV_START.has(mark)) parts.push(`{${NAV_TEXT[mark]}}`);
  if (b.dynamic) parts.push(`{${b.dynamic}}`);
  if (b.tempoMark) parts.push(`{${b.tempoMark === "atempo" ? "a tempo" : b.tempoMark}}`);
  const timed = b.items.filter(isTimed);
  const shown = beatsShown(timed, b.beats);
  for (const item of b.items) {
    parts.push(token(item, isTimed(item) && (shown[timed.indexOf(item)] as boolean)));
  }
  for (const cue of b.cues) {
    const to = who(cue.passes, cue.roles);
    parts.push(`{${to ? `${to}: ` : ""}${cue.text}}`);
  }
  if (b.lyric !== null) parts.push(`"${b.lyric}"`);
  for (const mark of b.nav) if (!NAV_START.has(mark)) parts.push(`{${NAV_TEXT[mark]}}`);
  return parts.join(" ");
}

/**
 * The canonical text of a chart's JSON form (spec Appendix C): a chart that parses with no
 * warnings reads back as the same JSON form, all but its version, and writing the text again
 * gives the same text (R-00.19).
 */
export function write(json: ChartJson): string {
  const meta = json.meta;
  const out = ["---", `chartdown: ${WRITTEN_VERSION}`];
  const names = [
    ...HEADER_ORDER.filter((name) => name in meta),
    ...Object.keys(meta).filter((name) => name !== "chartdown" && !HEADER_ORDER.includes(name)),
  ];
  for (const name of names) out.push(`${name}: ${meta[name]}`);
  out.push("---");

  // What a parser has in effect, starting from the header (spec C.3).
  let key = json.key;
  let minor = json.minor;
  const startMeter = /^(\d+)\s*\/\s*(\d+)$/.exec(meta.meter ?? "4/4");
  let meter = startMeter ? `${startMeter[1]}/${startMeter[2]}` : "4/4";
  const startTempo = meta.tempo === undefined ? undefined : readTempo(meta.tempo);
  let tempo: number | null = startTempo?.bpm ?? null;
  let unit: BeatUnit | null = startTempo?.unit ?? null;
  let unknown = startTempo?.unconfirmed === true;
  const keyLine = () => `@key ${key}${minor ? "m" : ""}`;

  for (const section of json.sections) {
    out.push("", `## ${section.name}`);
    for (const note of section.notes) {
      if (!note.md) {
        out.push(`> ${note.text}`);
        continue;
      }
      const to = who(note.passes, note.roles);
      out.push(`> MD${to ? ` ${to}` : ""}: ${note.text}`);
    }
    // Copied rows take the key in effect at the `@use` line (spec C.3).
    const first = section.rows[0];
    if (section.use && first && (first.key !== key || first.minor !== minor)) {
      key = first.key;
      minor = first.minor;
      out.push(keyLine());
    }
    if (section.use) {
      out.push(`@use ${section.use}${section.times === null ? "" : ` ${section.times}x`}`);
      continue;
    }
    for (const row of section.rows) {
      if (row.key !== key || row.minor !== minor) {
        key = row.key;
        minor = row.minor;
        out.push(keyLine());
      }
      if (row.meter !== meter) {
        meter = row.meter;
        out.push(`@meter ${meter}`);
      }
      const counts = unknown ? null : (unit ?? beatOf(meter) ?? null);
      if (row.tempo !== null && (row.tempo !== tempo || row.tempoUnit !== counts)) {
        tempo = row.tempo;
        unknown = row.tempoUnit === null;
        unit = unknown || row.tempoUnit === beatOf(meter) ? null : row.tempoUnit;
        out.push(`@tempo ${num(tempo)}${unknown ? " ?" : unit ? ` ${unit}` : ""}`);
      }
      const start = row.bars[0];
      const end = row.bars[row.bars.length - 1];
      out.push(
        (start?.repeatStart ? "|: " : "") +
          row.bars.map(bar).join(" | ") +
          (end?.repeatEnd ? ` :|${end.times !== 2 ? ` ${end.times}x` : ""}` : ""),
      );
    }
  }
  return `${out.join("\n").replace(/[ \t]+$/gm, "")}\n`;
}
