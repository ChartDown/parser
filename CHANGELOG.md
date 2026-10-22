# Changelog

## 0.5.0

The parser now implements [ChartDown 0.9](https://github.com/ChartDown/spec). Every valid 0.8 chart parses the same; its rows only gain what their tempo counts.

### New in the language (0.9)

- **A tempo's beat unit (spec 11.3).** `tempo: 58 q.` and `@tempo 87 q` name what one beat is: `h`, `h.`, `q`, `q.`, `e`, `e.` or `s`, with or without a space. `?` says the number is known but not what it counts. Tempos can have decimals.
- **Without a unit**, 6/8, 9/8 and 12/8 count the dotted quarter note, and every other meter its bottom number. An unwritten unit follows `@meter`; a written one stays.
- **A unit it can't read** is a warning (`bad-tempo` in the header, `bad-tempo-directive` after `@tempo`), and the tempo counts the meter's beat.
- **`chartdown: 0.9`** is a known version.

### New in the package

- `Row.tempoUnit` and `Chart.tempoUnit`: the unit written; `tempoUnconfirmed` for `?`.
- `rowBeatUnit(row)`, `meterBeat(meter)`, `eighthsPerMinute(bpm, unit)`, `readTempo(text)` and `EIGHTHS_PER_BEAT`; the `BeatUnit` type.
- `toJSON(chart)`: `rows[].tempoUnit` and `rows[].tempoEpm` (Appendix A).
- The pinned conformance suite is ChartDown/spec at `cf868c1`: 156 cases, 8 of them new.
- `READABLE_VERSIONS` reads 0.3 to 0.9; `SUPPORTED_VERSION` is `"0.9"`.
- The package description says it reads charts written for 0.3 to 0.9.

## 0.4.0

The parser now implements [ChartDown 0.8](https://github.com/ChartDown/spec). Every valid 0.7 chart parses the same: in 0.7, `@use Name 3x` looked for a section called "Name 3x" and warned that it wasn't found.

### New in the language (0.8)

- **A count after `@use` (spec 5.2).** `@use Bridge 2 3x` (or `x3`, any case) plays the copied rows 3 times in a row. Each time through plays them as written: their own repeats, endings and one-pass cues start over, so a copied `:| 2x` with `@use … 2x` plays four times. After a D.S. or D.C. jump the copied section plays once. `0x` is read as `1x`, with a warning (`use-zero-times`).
- **Passes in a counted copy (spec 9.1).** `> MD 2x: …` in a section with a `@use` count above 1 refers to the second time through the copy, and needs no repeat of its own.
- **`chartdown: 0.8`** is a known version.

### New in the package

- `Section.use.times`: the count of a `@use`, when it has one.
- `toJSON(chart)`: `sections[].times`, the count (1 for `0x`), or null with no count or no `@use` (Appendix A).
- `playOrder(chart)` plays a counted copy that many times.
- The pinned conformance suite is ChartDown/spec at `732dc25`: 148 cases, 6 of them new.
- `READABLE_VERSIONS` reads 0.3 to 0.8; `SUPPORTED_VERSION` is `"0.8"`.

## 0.3.0

The parser now implements [ChartDown 0.7](https://github.com/ChartDown/spec). Charts written for 0.3 to 0.6 parse the same, with no version warning, except that a chord quality written with an alias now takes its canonical form.

### New in the language (0.7)

- **Chord qualities (spec 6).** Aliases take their canonical form: `-`, `min` and `mi` are `m`; `ø` is `m7b5`; `°7` is `dim7` and `°` is `dim`; `+` is `aug`; `Δ` alone is `maj7`, and `Δ`, `M` or `ma` before a number are `maj`; `sus4` is `sus`; parentheses are dropped. A quality outside the vocabulary passes through as written. Number style shows `-` for every minor quality (`m7b5` reads `-7b5`).
- **`numbering: 6m` (spec 3 and 12).** Numbers in a minor key count from its relative major: in Em, `6m` is Em and `1` is G. Any value but `1m` or `6m` is a warning (`bad-numbering`).
- **Grammar (spec 15).** Directive names are read in any case (`@KEY D`); an `@key` value the parser cannot read is a warning (`bad-key-directive`).

### New in the package

- `toJSON(chart)`: a top-level `numbering`, `minor` on every row, and `quality` in its canonical form.
- `Chart.numbering` and the `Numbering` type; `degree()` takes the numbering.
- `READABLE_VERSIONS` reads 0.3 to 0.7; `SUPPORTED_VERSION` is `"0.7"`.

- `chartdown/conformance`: the adapter for the official ChartDown conformance suite (spec Appendix B), with `toJSON(source)` and `display(source, { style, key })`. The package's own tests run the suite, pinned to a commit of github.com/ChartDown/spec.
- The parser has its own repository, [github.com/ChartDown/parser](https://github.com/ChartDown/parser), in the ChartDown organization next to the spec; the package's homepage, repository and issues point there.

## 0.2.0

The parser now implements [ChartDown 0.6](https://github.com/ChartDown/spec). Charts written for 0.3, 0.4 and 0.5 parse the same, with no version warning.

### New in the language

- **0.5.** Pickup bars (`[p:N]`, bar 0), partial rests (`x:beats`) with the tokens of a bar sharing what is left of it, the sixteenth-note push (`''`) and unison riffs (`R[ ... ]`).
- **0.6.** Meter and tempo changes (`@meter`, `[m:N/D]`, `@tempo`), tempo marks (`{rit}`, `{accel}`, `{a tempo}`), cues and MD notes for one pass of a repeat (`{2x drums: in}`, `> MD 2x bass: ...`), repeat counts written `:| 3x` (`:| x3` still works) and navigation marks (`{segno}`, `{coda}`, `{to coda}`, `{fine}`, D.S. and D.C. jumps) with warnings for an incomplete jump.

### New in the package

- `toJSON(chart)`: the JSON form of Appendix A of the spec, with the play order and the warnings.
- `playOrder(chart)`: the bars in the order they are played, after repeats, endings and navigation.
- `layoutBeats(items, total)`: the share of the bar each token takes (spec 5.1).
- `chordFormatter(...).root(root, row)`: a riff note as a number or a letter, in any key.
- `READABLE_VERSIONS`: the versions a chart may declare without a warning (0.3 to 0.6). `SUPPORTED_VERSION` is now `"0.6"`.
- Layers: a note can be for one pass (`passes`, written `> MD 2x drums: ...`), and a layer counts a pickup as bar 0.
- New warning codes: `bad-meter-directive`, `bad-tempo-directive`, `pickup-and-meter`, `pickup-length`, `pickup-not-first`, `pickup-beats-mismatch`, `riff-note`, `riff-beats-mismatch`, `pass-without-repeat`, `note-pass-without-repeat`, `nav-duplicate`, `nav-second-jump`, `nav-needs-segno`, `nav-needs-coda` and `nav-needs-fine`.

### Changes to watch when upgrading from 0.1

- `Bar.number`, `Cue.passes` and `Note.passes` are always set; `Row.meter` is the meter in effect for the row. Code that builds these objects by hand needs the new fields.
- `Chord.push` is still a boolean; `Chord.shortPush` is set for `''`.
- `BarItem` has a new member, `Riff`, and `NoChord` may carry `beats` and `explicitBeats` (`x:3`).
- `sectionLength` does not count a pickup bar.
- The `unsupported-version` warning's `supported` value is a range such as `0.3–0.6`.
- `@meter` and `@tempo` are directives now; before, they were unknown directives.
- `{fine}`, `{coda}`, `{segno}` and the other navigation marks, and `{rit}`, `{accel}` and `{a tempo}`, are reserved words: a cue with that exact text is now a mark.

## 0.1.0

First release: the parser for ChartDown 0.4, numbers and letters with transposition, instruments from a catalog, the music director's layer format and `sectionLength`.
