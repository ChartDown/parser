// What one beat of a tempo is (ChartDown 0.9, spec 11.3; R-00.18).
import type { BeatUnit, Meter } from "./types.js";

/** How many eighth notes one beat of each unit lasts (spec 11.3). */
export const EIGHTHS_PER_BEAT: Readonly<Record<BeatUnit, number>> = {
  h: 4,
  "h.": 6,
  q: 2,
  "q.": 3,
  e: 1,
  "e.": 1.5,
  s: 0.5,
};

/** A tempo as written: its number and, when given, its unit or `?`. */
export interface TempoText {
  bpm: number;
  /** The unit written after the number; absent when none was, or with `?`. */
  unit?: BeatUnit;
  /** `?`: the number is known, what it counts is not (spec 11.3). */
  unconfirmed?: true;
  /** A unit was written that ChartDown doesn't have: a warning, and the meter's beat counts. */
  badUnit?: true;
}

/** Reads `72`, `58 q.`, `174e`, `74.5` or `58 ?`; undefined when there is no number to read. */
export function readTempo(text: string): TempoText | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*(\S*)$/.exec(text.trim());
  if (!match) return undefined;
  const tempo: TempoText = { bpm: Number.parseFloat(match[1] as string) };
  const unit = match[2] as string;
  if (unit === "?") tempo.unconfirmed = true;
  else if (unit in EIGHTHS_PER_BEAT) tempo.unit = unit as BeatUnit;
  else if (unit) tempo.badUnit = true;
  return tempo;
}

/**
 * The beat a tempo counts when it names none (spec 11.3): the meter's bottom number, except in
 * 6/8, 9/8 and 12/8 (over 8, the top a multiple of 3 above 3), the dotted quarter note.
 * Undefined for a meter whose bottom number has no unit (over 1 or 32).
 */
export function meterBeat(meter: Meter): BeatUnit | undefined {
  if (meter.unit === 8 && meter.beats > 3 && meter.beats % 3 === 0) return "q.";
  return ({ 2: "h", 4: "q", 8: "e", 16: "s" } as Record<number, BeatUnit>)[meter.unit];
}

/** A tempo in eighth notes per minute, the one speed to compare, convert or play (spec 11.3). */
export function eighthsPerMinute(bpm: number, unit: BeatUnit): number {
  return bpm * EIGHTHS_PER_BEAT[unit];
}

/**
 * What a row's tempo counts: the unit written, or the meter's beat; undefined with no tempo or
 * with `?`.
 */
export function rowBeatUnit(row: {
  tempo?: number;
  tempoUnit?: BeatUnit;
  tempoUnconfirmed?: true;
  meter: Meter;
}): BeatUnit | undefined {
  if (row.tempo === undefined || row.tempoUnconfirmed) return undefined;
  return row.tempoUnit ?? meterBeat(row.meter);
}
